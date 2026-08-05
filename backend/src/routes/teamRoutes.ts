import { createHash, randomBytes } from "crypto";
import { Router } from "express";
import { authorize, workspaceScope } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { Client } from "../models/Client";
import { Invite } from "../models/Invite";
import { Project } from "../models/Project";
import { Task } from "../models/Task";
import { TimeEntry } from "../models/TimeEntry";
import { User } from "../models/User";
import { Workspace } from "../models/Workspace";
import { getEnv } from "../config/env";
import { sendInviteEmail } from "../services/emailService";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { teamSchemas } from "../validation/schemas";

export const teamRoutes = Router();
teamRoutes.use(authorize("owner", "manager"));

teamRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const [allUsers, allInvites] = await Promise.all([
      User.find({
        workspace: req.user!.workspace,
        removed: false,
      })
        .select("-__v")
        .sort({ role: 1, name: 1 })
        .lean(),
      Invite.find({
        workspace: req.user!.workspace,
        status: "pending",
      })
        .select("-tokenHash")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const users = allUsers.filter((user) =>
      ["owner", "manager", "member"].includes(user.role),
    );
    const invites = allInvites.filter((invite) =>
      ["manager", "member"].includes(invite.role),
    );

    res.json({ success: true, result: { users, invites } });
  }),
);

teamRoutes.post(
  "/invite",
  validate({ body: teamSchemas.invite }),
  asyncHandler(async (req, res) => {
    if (req.user!.role === "manager" && req.body.role !== "member") {
      throw new ApiError(403, "Managers can only invite Members.");
    }
    if (req.body.role === "client") {
      const exists = await Client.exists({
        _id: req.body.client,
        ...workspaceScope(req),
      });
      if (!exists)
        throw new ApiError(422, "Client does not belong to this workspace.");
    }
    if (
      await User.exists({ email: req.body.email.toLowerCase(), removed: false })
    ) {
      throw new ApiError(409, "An account with this email already exists.");
    }
    await Invite.updateMany(
      {
        workspace: req.user!.workspace,
        email: req.body.email.toLowerCase(),
        status: "pending",
      },
      { status: "revoked" },
    );
    const token = randomBytes(32).toString("hex");
    const invite = await Invite.create({
      workspace: req.user!.workspace,
      email: req.body.email.toLowerCase(),
      role: req.body.role,
      client: req.body.client,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      invitedBy: req.user!._id,
    });
    const workspace = await Workspace.findById(req.user!.workspace).select(
      "name",
    );
    const inviteUrl = `${getEnv().APP_URL}/accept-invite?token=${token}`;
    const emailStatus = await sendInviteEmail({
      email: invite.email,
      inviterName: req.user!.name,
      workspaceName: workspace?.name ?? "your workspace",
      inviteUrl,
    });
    res.status(201).json({
      success: true,
      result: {
        invite: {
          _id: invite._id,
          email: invite.email,
          role: invite.role,
          status: invite.status,
          expiresAt: invite.expiresAt,
        },
        emailStatus,
        ...(getEnv().NODE_ENV !== "production" ? { inviteUrl } : {}),
      },
    });
  }),
);

teamRoutes.delete(
  "/invite/:inviteId",
  validate({ params: teamSchemas.revokeInvite }),
  asyncHandler(async (req, res) => {
    const invite = await Invite.findOneAndUpdate(
      {
        _id: req.params.inviteId,
        workspace: req.user!.workspace,
        status: "pending",
      },
      { status: "revoked" },
      { new: true },
    );
    if (!invite) throw new ApiError(404, "Pending invitation not found.");
    res.json({ success: true, result: invite });
  }),
);

teamRoutes.delete(
  "/user/:userId",
  validate({ params: teamSchemas.revokeUser }),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({
      _id: req.params.userId,
      workspace: req.user!.workspace,
      removed: false,
    });
    if (!user) throw new ApiError(404, "Team member not found.");
    if (user.role === "owner" || user._id.equals(req.user!._id)) {
      throw new ApiError(
        403,
        "The workspace owner or current user cannot be revoked.",
      );
    }
    if (req.user!.role === "manager" && user.role !== "member") {
      throw new ApiError(403, "Managers can only revoke Members.");
    }
    const [openTask, runningTimer] = await Promise.all([
      Task.exists({
        workspace: req.user!.workspace,
        assignee: user._id,
        removed: false,
        status: { $ne: "done" },
      }),
      TimeEntry.exists({
        workspace: req.user!.workspace,
        user: user._id,
        removed: false,
        running: true,
      }),
    ]);
    if (openTask || runningTimer) {
      throw new ApiError(409, "Reassign open tasks and stop running timers before revoking access.");
    }
    user.enabled = false;
    user.removed = true;
    await user.save();
    await Project.updateMany(
      { workspace: req.user!.workspace, teamMembers: user._id },
      { $pull: { teamMembers: user._id } }
    );
    res.json({ success: true, result: user });
  }),
);

teamRoutes.get(
  "/portal-access",
  authorize("owner"),
  asyncHandler(async (req, res) => {
    const [users, invites] = await Promise.all([
      User.find({
        workspace: req.user!.workspace,
        removed: false,
        role: "client",
      })
        .populate("client", "name")
        .select("name email client enabled createdAt")
        .lean(),
      Invite.find({
        workspace: req.user!.workspace,
        status: "pending",
        role: "client",
      })
        .populate("client", "name")
        .select("-tokenHash")
        .lean(),
    ]);
    res.json({ success: true, result: { users, invites } });
  }),
);
