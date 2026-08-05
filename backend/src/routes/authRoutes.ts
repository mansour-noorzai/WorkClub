import { createHash } from "crypto";
import { Router, type Request, type Response } from "express";
import { Types, type HydratedDocument } from "mongoose";
import { getEnv } from "../config/env";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { Invite } from "../models/Invite";
import { User, type IUser } from "../models/User";
import { UserCredential, type IUserCredential } from "../models/UserCredential";
import { Workspace, type IWorkspace } from "../models/Workspace";
import {
  createOpaqueToken,
  createRefreshSession,
  hashOpaqueToken,
  hashPassword,
  issueAuthToken,
  verifyPassword,
} from "../services/authService";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../services/emailService";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { toSlug } from "../utils/slug";
import { authSchemas } from "../validation/schemas";

export const authRoutes = Router();

authRoutes.post(
  "/login",
  validate({ body: authSchemas.login }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({
      email: email.toLowerCase(),
      removed: false,
    });
    if (!user) throw new ApiError(401, "Invalid email or password.");
    if (!user.enabled)
      throw new ApiError(403, "This account has been disabled.");

    const credential = await UserCredential.findOne({
      user: user._id,
      removed: false,
    });
    if (
      !credential ||
      !verifyPassword(password, credential.salt, credential.password)
    ) {
      throw new ApiError(401, "Invalid email or password.");
    }
    if (getEnv().REQUIRE_EMAIL_VERIFICATION && !credential.emailVerified) {
      throw new ApiError(403, "Verify your email address before signing in.");
    }

    const session = await createSession(user, credential, req);
    setRefreshCookie(res, session.refreshToken);
    res.json({
      success: true,
      result: sessionResponse(user, session.accessToken),
    });
  }),
);

authRoutes.post(
  "/register-workspace",
  validate({ body: authSchemas.registerWorkspace }),
  asyncHandler(async (req, res) => {
    const { workspaceName, name, email, password } = req.body;
    if (await User.exists({ email: email.toLowerCase() })) {
      throw new ApiError(409, "An account with this email already exists.");
    }

    const userId = new Types.ObjectId();
    const workspaceId = new Types.ObjectId();
    const baseSlug = toSlug(workspaceName) || "workspace";
    const slug = `${baseSlug}-${workspaceId.toString().slice(-6)}`;
    const passwordData = hashPassword(password);

    let workspace!: HydratedDocument<IWorkspace>;
    let user!: HydratedDocument<IUser>;
    try {
      workspace = await Workspace.create({
        _id: workspaceId,
        name: workspaceName,
        slug,
        owner: userId,
      });
      user = await User.create({
        _id: userId,
        workspace: workspaceId,
        name,
        email: email.toLowerCase(),
        role: "owner",
        enabled: true,
      });
      const requiresVerification = getEnv().REQUIRE_EMAIL_VERIFICATION;
      const credential = await UserCredential.create({
        user: user._id,
        ...passwordData,
        emailVerified: !requiresVerification,
      });

      if (requiresVerification) {
        const verification = await createVerification(credential);
        const verificationUrl = `${getEnv().APP_URL}/verify-email?token=${verification}`;
        const emailStatus = await sendVerificationEmail({
          email: user.email,
          verificationUrl,
        });
        return res.status(201).json({
          success: true,
          result: {
            workspace,
            user: publicUser(user),
            requiresVerification: true,
            emailStatus,
            ...(getEnv().NODE_ENV !== "production" ? { verificationUrl } : {}),
          },
        });
      }

      const session = await createSession(user, credential, req);
      setRefreshCookie(res, session.refreshToken);
      return res.status(201).json({
        success: true,
        result: {
          workspace,
          ...sessionResponse(user, session.accessToken),
          requiresVerification: false,
        },
      });
    } catch (error) {
      await Promise.all([
        UserCredential.deleteOne({ user: userId }),
        Workspace.deleteOne({ _id: workspaceId }),
        User.deleteOne({ _id: userId }),
      ]);
      throw error;
    }
  }),
);

authRoutes.post(
  "/accept-invite",
  validate({ body: authSchemas.acceptInvite }),
  asyncHandler(async (req, res) => {
    const { token, name, password } = req.body;
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const invite = await Invite.findOneAndUpdate(
      {
        tokenHash,
        status: "pending",
        expiresAt: { $gt: new Date() },
      },
      { $set: { status: "accepted" } },
      { new: true },
    );
    if (!invite)
      throw new ApiError(410, "This invitation is invalid or expired.");
    let createdUserId: Types.ObjectId | undefined;
    try {
      const user = await User.create({
        workspace: invite.workspace,
        client: invite.client,
        email: invite.email,
        name,
        role: invite.role,
        enabled: true,
      });
      createdUserId = user._id;
      const credential = await UserCredential.create({
        user: user._id,
        ...hashPassword(password),
        emailVerified: true,
      });
      const session = await createSession(user, credential, req);
      setRefreshCookie(res, session.refreshToken);
      res.status(201).json({
        success: true,
        result: sessionResponse(user, session.accessToken),
      });
    } catch (error) {
      await Promise.all([
        createdUserId
          ? UserCredential.deleteOne({ user: createdUserId })
          : Promise.resolve(),
        createdUserId
          ? User.deleteOne({ _id: createdUserId })
          : Promise.resolve(),
        Invite.updateOne(
          { _id: invite._id, status: "accepted" },
          { $set: { status: "pending" } },
        ),
      ]);
      if ((error as { code?: number }).code === 11000) {
        throw new ApiError(409, "An account with this email already exists.");
      }
      throw error;
    }
  }),
);

authRoutes.post(
  "/refresh",
  validate({ body: authSchemas.refresh }),
  asyncHandler(async (req, res) => {
    const refreshToken =
      req.cookies?.[getEnv().REFRESH_COOKIE_NAME] ?? req.body.refreshToken;
    if (!refreshToken) throw new ApiError(401, "Refresh session is missing.");

    const oldHash = hashOpaqueToken(refreshToken);
    const now = new Date();
    const credential = await UserCredential.findOne({
      removed: false,
      sessions: {
        $elemMatch: {
          refreshTokenHash: oldHash,
          expiresAt: { $gt: now },
        },
      },
    });
    if (!credential) {
      clearRefreshCookie(res);
      throw new ApiError(401, "Refresh session is invalid or expired.");
    }

    const existingSession = credential.sessions.find(
      (session) => session.refreshTokenHash === oldHash && session.expiresAt > now,
    );
    if (!existingSession) {
      clearRefreshCookie(res);
      throw new ApiError(401, "Refresh session is invalid or expired.");
    }

    const rotated = createRefreshSession({
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    const updated = await UserCredential.findOneAndUpdate(
      {
        _id: credential._id,
        sessions: {
          $elemMatch: {
            sessionId: existingSession.sessionId,
            refreshTokenHash: oldHash,
            expiresAt: { $gt: now },
          },
        },
      },
      {
        $set: {
          "sessions.$.refreshTokenHash": rotated.session.refreshTokenHash,
          "sessions.$.lastUsedAt": rotated.session.lastUsedAt,
          "sessions.$.expiresAt": rotated.session.expiresAt,
          "sessions.$.ip": rotated.session.ip,
          "sessions.$.userAgent": rotated.session.userAgent,
        },
      },
      { new: true },
    );
    if (!updated) {
      clearRefreshCookie(res);
      throw new ApiError(401, "Refresh session is invalid or expired.");
    }

    const user = await User.findOne({
      _id: credential.user,
      removed: false,
      enabled: true,
    });
    if (!user) {
      clearRefreshCookie(res);
      throw new ApiError(401, "Refresh session is invalid or expired.");
    }

    const activeSession = updated.sessions.find(
      (session) => session.sessionId === existingSession.sessionId,
    );
    if (!activeSession) {
      clearRefreshCookie(res);
      throw new ApiError(401, "Refresh session is invalid or expired.");
    }

    const accessToken = issueAuthToken(user, activeSession.sessionId);
    setRefreshCookie(res, rotated.refreshToken);
    res.json({ success: true, result: sessionResponse(user, accessToken) });
  }),
);

authRoutes.post(
  "/request-password-reset",
  validate({ body: authSchemas.requestPasswordReset }),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({
      email: req.body.email.toLowerCase(),
      removed: false,
      enabled: true,
    });

    let resetUrl: string | undefined;
    let emailStatus: "sent" | "failed" | "skipped" | undefined;
    if (user) {
      const resetToken = createOpaqueToken();
      await UserCredential.updateOne(
        { user: user._id, removed: false },
        {
          $set: {
            resetTokenHash: hashOpaqueToken(resetToken),
            resetTokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
          },
        },
      );
      resetUrl = `${getEnv().APP_URL}/reset-password?token=${resetToken}`;
      emailStatus = await sendPasswordResetEmail({
        email: user.email,
        resetUrl,
      });
    }

    res.status(202).json({
      success: true,
      result: {
        message: "If that account exists, a password-reset link has been sent.",
        ...(getEnv().NODE_ENV !== "production" && resetUrl
          ? { resetUrl, emailStatus }
          : {}),
      },
    });
  }),
);

authRoutes.post(
  "/reset-password",
  validate({ body: authSchemas.resetPassword }),
  asyncHandler(async (req, res) => {
    const credential = await UserCredential.findOne({
      resetTokenHash: hashOpaqueToken(req.body.token),
      resetTokenExpiresAt: { $gt: new Date() },
      removed: false,
    });
    if (!credential)
      throw new ApiError(
        410,
        "This password-reset link is invalid or expired.",
      );

    const user = await User.findOne({
      _id: credential.user,
      removed: false,
      enabled: true,
    });
    if (!user)
      throw new ApiError(
        410,
        "This password-reset link is invalid or expired.",
      );

    const passwordData = hashPassword(req.body.password);
    credential.password = passwordData.password;
    credential.salt = passwordData.salt;
    credential.passwordChangedAt = new Date();
    credential.emailVerified = true;
    credential.resetTokenHash = undefined;
    credential.resetTokenExpiresAt = undefined;
    credential.sessions = [];
    const session = await createSession(user, credential, req);
    setRefreshCookie(res, session.refreshToken);
    res.json({
      success: true,
      result: sessionResponse(user, session.accessToken),
    });
  }),
);

authRoutes.post(
  "/verify-email",
  validate({ body: authSchemas.verifyEmail }),
  asyncHandler(async (req, res) => {
    const credential = await UserCredential.findOne({
      verificationTokenHash: hashOpaqueToken(req.body.token),
      verificationTokenExpiresAt: { $gt: new Date() },
      removed: false,
    });
    if (!credential)
      throw new ApiError(410, "This verification link is invalid or expired.");
    const user = await User.findOne({
      _id: credential.user,
      removed: false,
      enabled: true,
    });
    if (!user)
      throw new ApiError(410, "This verification link is invalid or expired.");

    credential.emailVerified = true;
    credential.verificationTokenHash = undefined;
    credential.verificationTokenExpiresAt = undefined;
    const session = await createSession(user, credential, req);
    setRefreshCookie(res, session.refreshToken);
    res.json({
      success: true,
      result: sessionResponse(user, session.accessToken),
    });
  }),
);

authRoutes.post(
  "/resend-verification",
  validate({ body: authSchemas.resendVerification }),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({
      email: req.body.email.toLowerCase(),
      removed: false,
      enabled: true,
    });
    const credential = user
      ? await UserCredential.findOne({ user: user._id, removed: false })
      : null;

    let verificationUrl: string | undefined;
    if (user && credential && !credential.emailVerified) {
      const verificationToken = await createVerification(credential);
      verificationUrl = `${getEnv().APP_URL}/verify-email?token=${verificationToken}`;
      await sendVerificationEmail({ email: user.email, verificationUrl });
    }

    res.status(202).json({
      success: true,
      result: {
        message: "If verification is required, a new link has been sent.",
        ...(getEnv().NODE_ENV !== "production" && verificationUrl
          ? { verificationUrl }
          : {}),
      },
    });
  }),
);

authRoutes.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const workspace = await Workspace.findOne({
      _id: req.user!.workspace,
      removed: false,
    }).lean();
    res.json({
      success: true,
      result: { user: publicUser(req.user!), workspace },
    });
  }),
);

authRoutes.get(
  "/sessions",
  authenticate,
  asyncHandler(async (req, res) => {
    const credential = await UserCredential.findOne({
      user: req.user!._id,
      removed: false,
    });
    const sessions = (credential?.sessions ?? []).map((session) => ({
      sessionId: session.sessionId,
      current: session.sessionId === req.sessionId,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      ip: session.ip,
      userAgent: session.userAgent,
    }));
    res.json({ success: true, result: sessions });
  }),
);

authRoutes.delete(
  "/sessions/:sessionId",
  authenticate,
  validate({ params: authSchemas.sessionParams }),
  asyncHandler(async (req, res) => {
    await UserCredential.updateOne(
      { user: req.user!._id },
      { $pull: { sessions: { sessionId: req.params.sessionId } } },
    );
    if (req.params.sessionId === req.sessionId) clearRefreshCookie(res);
    res.json({ success: true, result: null });
  }),
);

authRoutes.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[getEnv().REFRESH_COOKIE_NAME] as
      | string
      | undefined;
    if (refreshToken) {
      await UserCredential.updateOne(
        {
          "sessions.refreshTokenHash": hashOpaqueToken(refreshToken),
          removed: false,
        },
        {
          $pull: {
            sessions: { refreshTokenHash: hashOpaqueToken(refreshToken) },
          },
        },
      );
    }
    clearRefreshCookie(res);
    res.json({ success: true, result: null });
  }),
);

authRoutes.post(
  "/logout-all",
  authenticate,
  asyncHandler(async (req, res) => {
    await UserCredential.updateOne(
      { user: req.user!._id },
      { $set: { sessions: [] } },
    );
    clearRefreshCookie(res);
    res.json({ success: true, result: null });
  }),
);

async function createSession(
  user: HydratedDocument<IUser>,
  credential: HydratedDocument<IUserCredential>,
  req: Request,
) {
  const created = createRefreshSession({
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  credential.sessions.push(created.session);
  credential.sessions = credential.sessions
    .filter((session) => session.expiresAt.getTime() > Date.now())
    .sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime())
    .slice(0, 10);
  await credential.save();
  return {
    refreshToken: created.refreshToken,
    accessToken: issueAuthToken(user, created.session.sessionId),
  };
}

async function createVerification(
  credential: HydratedDocument<IUserCredential>,
) {
  const token = createOpaqueToken();
  credential.verificationTokenHash = hashOpaqueToken(token);
  credential.verificationTokenExpiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000,
  );
  await credential.save();
  return token;
}

function setRefreshCookie(res: Response, refreshToken: string) {
  const env = getEnv();
  res.cookie(env.REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response) {
  const env = getEnv();
  res.clearCookie(env.REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/api/auth",
  });
}

function sessionResponse(user: HydratedDocument<IUser>, accessToken: string) {
  return {
    user: publicUser(user),
    accessToken,
  };
}

function publicUser(user: {
  _id: Types.ObjectId;
  workspace: Types.ObjectId;
  client?: Types.ObjectId;
  email: string;
  name: string;
  surname?: string;
  role: string;
  photo?: string;
}) {
  return {
    _id: user._id,
    workspace: user.workspace,
    client: user.client,
    email: user.email,
    name: user.name,
    surname: user.surname,
    role: user.role,
    photo: user.photo,
  };
}
