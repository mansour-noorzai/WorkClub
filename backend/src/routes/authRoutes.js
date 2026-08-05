"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
var crypto_1 = require("crypto");
var express_1 = require("express");
var mongoose_1 = require("mongoose");
var env_1 = require("../config/env");
var authenticate_1 = require("../middleware/authenticate");
var validate_1 = require("../middleware/validate");
var Invite_1 = require("../models/Invite");
var User_1 = require("../models/User");
var UserCredential_1 = require("../models/UserCredential");
var Workspace_1 = require("../models/Workspace");
var authService_1 = require("../services/authService");
var emailService_1 = require("../services/emailService");
var apiError_1 = require("../utils/apiError");
var asyncHandler_1 = require("../utils/asyncHandler");
var slug_1 = require("../utils/slug");
var schemas_1 = require("../validation/schemas");
exports.authRoutes = (0, express_1.Router)();
exports.authRoutes.post("/login", (0, validate_1.validate)({ body: schemas_1.authSchemas.login }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, user, credential, session;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, email = _a.email, password = _a.password;
                return [4 /*yield*/, User_1.User.findOne({
                        email: email.toLowerCase(),
                        removed: false,
                    })];
            case 1:
                user = _b.sent();
                if (!user)
                    throw new apiError_1.ApiError(401, "Invalid email or password.");
                if (!user.enabled)
                    throw new apiError_1.ApiError(403, "This account has been disabled.");
                return [4 /*yield*/, UserCredential_1.UserCredential.findOne({
                        user: user._id,
                        removed: false,
                    })];
            case 2:
                credential = _b.sent();
                if (!credential ||
                    !(0, authService_1.verifyPassword)(password, credential.salt, credential.password)) {
                    throw new apiError_1.ApiError(401, "Invalid email or password.");
                }
                if ((0, env_1.getEnv)().REQUIRE_EMAIL_VERIFICATION && !credential.emailVerified) {
                    throw new apiError_1.ApiError(403, "Verify your email address before signing in.");
                }
                return [4 /*yield*/, createSession(user, credential, req)];
            case 3:
                session = _b.sent();
                setRefreshCookie(res, session.refreshToken);
                res.json({
                    success: true,
                    result: sessionResponse(user, session.accessToken),
                });
                return [2 /*return*/];
        }
    });
}); }));
exports.authRoutes.post("/register-workspace", (0, validate_1.validate)({ body: schemas_1.authSchemas.registerWorkspace }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, workspaceName, name, email, password, userId, workspaceId, baseSlug, slug, passwordData, workspace, user, requiresVerification, credential, verification, verificationUrl, emailStatus, session, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, workspaceName = _a.workspaceName, name = _a.name, email = _a.email, password = _a.password;
                return [4 /*yield*/, User_1.User.exists({ email: email.toLowerCase() })];
            case 1:
                if (_b.sent()) {
                    throw new apiError_1.ApiError(409, "An account with this email already exists.");
                }
                userId = new mongoose_1.Types.ObjectId();
                workspaceId = new mongoose_1.Types.ObjectId();
                baseSlug = (0, slug_1.toSlug)(workspaceName) || "workspace";
                slug = "".concat(baseSlug, "-").concat(workspaceId.toString().slice(-6));
                passwordData = (0, authService_1.hashPassword)(password);
                _b.label = 2;
            case 2:
                _b.trys.push([2, 10, , 12]);
                return [4 /*yield*/, Workspace_1.Workspace.create({
                        _id: workspaceId,
                        name: workspaceName,
                        slug: slug,
                        owner: userId,
                    })];
            case 3:
                workspace = _b.sent();
                return [4 /*yield*/, User_1.User.create({
                        _id: userId,
                        workspace: workspaceId,
                        name: name,
                        email: email.toLowerCase(),
                        role: "owner",
                        enabled: true,
                    })];
            case 4:
                user = _b.sent();
                requiresVerification = (0, env_1.getEnv)().REQUIRE_EMAIL_VERIFICATION;
                return [4 /*yield*/, UserCredential_1.UserCredential.create(__assign(__assign({ user: user._id }, passwordData), { emailVerified: !requiresVerification }))];
            case 5:
                credential = _b.sent();
                if (!requiresVerification) return [3 /*break*/, 8];
                return [4 /*yield*/, createVerification(credential)];
            case 6:
                verification = _b.sent();
                verificationUrl = "".concat((0, env_1.getEnv)().APP_URL, "/verify-email?token=").concat(verification);
                return [4 /*yield*/, (0, emailService_1.sendVerificationEmail)({
                        email: user.email,
                        verificationUrl: verificationUrl,
                    })];
            case 7:
                emailStatus = _b.sent();
                return [2 /*return*/, res.status(201).json({
                        success: true,
                        result: __assign({ workspace: workspace, user: publicUser(user), requiresVerification: true, emailStatus: emailStatus }, ((0, env_1.getEnv)().NODE_ENV !== "production" ? { verificationUrl: verificationUrl } : {})),
                    })];
            case 8: return [4 /*yield*/, createSession(user, credential, req)];
            case 9:
                session = _b.sent();
                setRefreshCookie(res, session.refreshToken);
                return [2 /*return*/, res.status(201).json({
                        success: true,
                        result: __assign(__assign({ workspace: workspace }, sessionResponse(user, session.accessToken)), { requiresVerification: false }),
                    })];
            case 10:
                error_1 = _b.sent();
                return [4 /*yield*/, Promise.all([
                        UserCredential_1.UserCredential.deleteOne({ user: userId }),
                        Workspace_1.Workspace.deleteOne({ _id: workspaceId }),
                        User_1.User.deleteOne({ _id: userId }),
                    ])];
            case 11:
                _b.sent();
                throw error_1;
            case 12: return [2 /*return*/];
        }
    });
}); }));
exports.authRoutes.post("/accept-invite", (0, validate_1.validate)({ body: schemas_1.authSchemas.acceptInvite }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, token, name, password, tokenHash, invite, createdUserId, user, credential, session, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, token = _a.token, name = _a.name, password = _a.password;
                tokenHash = (0, crypto_1.createHash)("sha256").update(token).digest("hex");
                return [4 /*yield*/, Invite_1.Invite.findOneAndUpdate({
                        tokenHash: tokenHash,
                        status: "pending",
                        expiresAt: { $gt: new Date() },
                    }, { $set: { status: "accepted" } }, { new: true })];
            case 1:
                invite = _b.sent();
                if (!invite)
                    throw new apiError_1.ApiError(410, "This invitation is invalid or expired.");
                _b.label = 2;
            case 2:
                _b.trys.push([2, 6, , 8]);
                return [4 /*yield*/, User_1.User.create({
                        workspace: invite.workspace,
                        client: invite.client,
                        email: invite.email,
                        name: name,
                        role: invite.role,
                        enabled: true,
                    })];
            case 3:
                user = _b.sent();
                createdUserId = user._id;
                return [4 /*yield*/, UserCredential_1.UserCredential.create(__assign(__assign({ user: user._id }, (0, authService_1.hashPassword)(password)), { emailVerified: true }))];
            case 4:
                credential = _b.sent();
                return [4 /*yield*/, createSession(user, credential, req)];
            case 5:
                session = _b.sent();
                setRefreshCookie(res, session.refreshToken);
                res.status(201).json({
                    success: true,
                    result: sessionResponse(user, session.accessToken),
                });
                return [3 /*break*/, 8];
            case 6:
                error_2 = _b.sent();
                return [4 /*yield*/, Promise.all([
                        createdUserId
                            ? UserCredential_1.UserCredential.deleteOne({ user: createdUserId })
                            : Promise.resolve(),
                        createdUserId
                            ? User_1.User.deleteOne({ _id: createdUserId })
                            : Promise.resolve(),
                        Invite_1.Invite.updateOne({ _id: invite._id, status: "accepted" }, { $set: { status: "pending" } }),
                    ])];
            case 7:
                _b.sent();
                if (error_2.code === 11000) {
                    throw new apiError_1.ApiError(409, "An account with this email already exists.");
                }
                throw error_2;
            case 8: return [2 /*return*/];
        }
    });
}); }));
exports.authRoutes.post("/refresh", (0, validate_1.validate)({ body: schemas_1.authSchemas.refresh }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var refreshToken, oldHash, now, credential, existingSession, rotated, updated, user, activeSession, accessToken;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                refreshToken = (_b = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a[(0, env_1.getEnv)().REFRESH_COOKIE_NAME]) !== null && _b !== void 0 ? _b : req.body.refreshToken;
                if (!refreshToken)
                    throw new apiError_1.ApiError(401, "Refresh session is missing.");
                oldHash = (0, authService_1.hashOpaqueToken)(refreshToken);
                now = new Date();
                return [4 /*yield*/, UserCredential_1.UserCredential.findOne({
                        removed: false,
                        sessions: {
                            $elemMatch: {
                                refreshTokenHash: oldHash,
                                expiresAt: { $gt: now },
                            },
                        },
                    })];
            case 1:
                credential = _c.sent();
                if (!credential) {
                    clearRefreshCookie(res);
                    throw new apiError_1.ApiError(401, "Refresh session is invalid or expired.");
                }
                existingSession = credential.sessions.find(function (session) { return session.refreshTokenHash === oldHash && session.expiresAt > now; });
                if (!existingSession) {
                    clearRefreshCookie(res);
                    throw new apiError_1.ApiError(401, "Refresh session is invalid or expired.");
                }
                rotated = (0, authService_1.createRefreshSession)({
                    ip: req.ip,
                    userAgent: req.get("user-agent"),
                });
                return [4 /*yield*/, UserCredential_1.UserCredential.findOneAndUpdate({
                        _id: credential._id,
                        sessions: {
                            $elemMatch: {
                                sessionId: existingSession.sessionId,
                                refreshTokenHash: oldHash,
                                expiresAt: { $gt: now },
                            },
                        },
                    }, {
                        $set: {
                            "sessions.$.refreshTokenHash": rotated.session.refreshTokenHash,
                            "sessions.$.lastUsedAt": rotated.session.lastUsedAt,
                            "sessions.$.expiresAt": rotated.session.expiresAt,
                            "sessions.$.ip": rotated.session.ip,
                            "sessions.$.userAgent": rotated.session.userAgent,
                        },
                    }, { new: true })];
            case 2:
                updated = _c.sent();
                if (!updated) {
                    clearRefreshCookie(res);
                    throw new apiError_1.ApiError(401, "Refresh session is invalid or expired.");
                }
                return [4 /*yield*/, User_1.User.findOne({
                        _id: credential.user,
                        removed: false,
                        enabled: true,
                    })];
            case 3:
                user = _c.sent();
                if (!user) {
                    clearRefreshCookie(res);
                    throw new apiError_1.ApiError(401, "Refresh session is invalid or expired.");
                }
                activeSession = updated.sessions.find(function (session) { return session.sessionId === existingSession.sessionId; });
                if (!activeSession) {
                    clearRefreshCookie(res);
                    throw new apiError_1.ApiError(401, "Refresh session is invalid or expired.");
                }
                accessToken = (0, authService_1.issueAuthToken)(user, activeSession.sessionId);
                setRefreshCookie(res, rotated.refreshToken);
                res.json({ success: true, result: sessionResponse(user, accessToken) });
                return [2 /*return*/];
        }
    });
}); }));
exports.authRoutes.post("/request-password-reset", (0, validate_1.validate)({ body: schemas_1.authSchemas.requestPasswordReset }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, resetUrl, emailStatus, resetToken;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, User_1.User.findOne({
                    email: req.body.email.toLowerCase(),
                    removed: false,
                    enabled: true,
                })];
            case 1:
                user = _a.sent();
                if (!user) return [3 /*break*/, 4];
                resetToken = (0, authService_1.createOpaqueToken)();
                return [4 /*yield*/, UserCredential_1.UserCredential.updateOne({ user: user._id, removed: false }, {
                        $set: {
                            resetTokenHash: (0, authService_1.hashOpaqueToken)(resetToken),
                            resetTokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
                        },
                    })];
            case 2:
                _a.sent();
                resetUrl = "".concat((0, env_1.getEnv)().APP_URL, "/reset-password?token=").concat(resetToken);
                return [4 /*yield*/, (0, emailService_1.sendPasswordResetEmail)({
                        email: user.email,
                        resetUrl: resetUrl,
                    })];
            case 3:
                emailStatus = _a.sent();
                _a.label = 4;
            case 4:
                res.status(202).json({
                    success: true,
                    result: __assign({ message: "If that account exists, a password-reset link has been sent." }, ((0, env_1.getEnv)().NODE_ENV !== "production" && resetUrl
                        ? { resetUrl: resetUrl, emailStatus: emailStatus }
                        : {})),
                });
                return [2 /*return*/];
        }
    });
}); }));
exports.authRoutes.post("/reset-password", (0, validate_1.validate)({ body: schemas_1.authSchemas.resetPassword }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var credential, user, passwordData, session;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, UserCredential_1.UserCredential.findOne({
                    resetTokenHash: (0, authService_1.hashOpaqueToken)(req.body.token),
                    resetTokenExpiresAt: { $gt: new Date() },
                    removed: false,
                })];
            case 1:
                credential = _a.sent();
                if (!credential)
                    throw new apiError_1.ApiError(410, "This password-reset link is invalid or expired.");
                return [4 /*yield*/, User_1.User.findOne({
                        _id: credential.user,
                        removed: false,
                        enabled: true,
                    })];
            case 2:
                user = _a.sent();
                if (!user)
                    throw new apiError_1.ApiError(410, "This password-reset link is invalid or expired.");
                passwordData = (0, authService_1.hashPassword)(req.body.password);
                credential.password = passwordData.password;
                credential.salt = passwordData.salt;
                credential.passwordChangedAt = new Date();
                credential.emailVerified = true;
                credential.resetTokenHash = undefined;
                credential.resetTokenExpiresAt = undefined;
                credential.sessions = [];
                return [4 /*yield*/, createSession(user, credential, req)];
            case 3:
                session = _a.sent();
                setRefreshCookie(res, session.refreshToken);
                res.json({
                    success: true,
                    result: sessionResponse(user, session.accessToken),
                });
                return [2 /*return*/];
        }
    });
}); }));
exports.authRoutes.post("/verify-email", (0, validate_1.validate)({ body: schemas_1.authSchemas.verifyEmail }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var credential, user, session;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, UserCredential_1.UserCredential.findOne({
                    verificationTokenHash: (0, authService_1.hashOpaqueToken)(req.body.token),
                    verificationTokenExpiresAt: { $gt: new Date() },
                    removed: false,
                })];
            case 1:
                credential = _a.sent();
                if (!credential)
                    throw new apiError_1.ApiError(410, "This verification link is invalid or expired.");
                return [4 /*yield*/, User_1.User.findOne({
                        _id: credential.user,
                        removed: false,
                        enabled: true,
                    })];
            case 2:
                user = _a.sent();
                if (!user)
                    throw new apiError_1.ApiError(410, "This verification link is invalid or expired.");
                credential.emailVerified = true;
                credential.verificationTokenHash = undefined;
                credential.verificationTokenExpiresAt = undefined;
                return [4 /*yield*/, createSession(user, credential, req)];
            case 3:
                session = _a.sent();
                setRefreshCookie(res, session.refreshToken);
                res.json({
                    success: true,
                    result: sessionResponse(user, session.accessToken),
                });
                return [2 /*return*/];
        }
    });
}); }));
exports.authRoutes.post("/resend-verification", (0, validate_1.validate)({ body: schemas_1.authSchemas.resendVerification }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, credential, _a, verificationUrl, verificationToken;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, User_1.User.findOne({
                    email: req.body.email.toLowerCase(),
                    removed: false,
                    enabled: true,
                })];
            case 1:
                user = _b.sent();
                if (!user) return [3 /*break*/, 3];
                return [4 /*yield*/, UserCredential_1.UserCredential.findOne({ user: user._id, removed: false })];
            case 2:
                _a = _b.sent();
                return [3 /*break*/, 4];
            case 3:
                _a = null;
                _b.label = 4;
            case 4:
                credential = _a;
                if (!(user && credential && !credential.emailVerified)) return [3 /*break*/, 7];
                return [4 /*yield*/, createVerification(credential)];
            case 5:
                verificationToken = _b.sent();
                verificationUrl = "".concat((0, env_1.getEnv)().APP_URL, "/verify-email?token=").concat(verificationToken);
                return [4 /*yield*/, (0, emailService_1.sendVerificationEmail)({ email: user.email, verificationUrl: verificationUrl })];
            case 6:
                _b.sent();
                _b.label = 7;
            case 7:
                res.status(202).json({
                    success: true,
                    result: __assign({ message: "If verification is required, a new link has been sent." }, ((0, env_1.getEnv)().NODE_ENV !== "production" && verificationUrl
                        ? { verificationUrl: verificationUrl }
                        : {})),
                });
                return [2 /*return*/];
        }
    });
}); }));
exports.authRoutes.get("/me", authenticate_1.authenticate, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var workspace;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Workspace_1.Workspace.findOne({
                    _id: req.user.workspace,
                    removed: false,
                }).lean()];
            case 1:
                workspace = _a.sent();
                res.json({
                    success: true,
                    result: { user: publicUser(req.user), workspace: workspace },
                });
                return [2 /*return*/];
        }
    });
}); }));
exports.authRoutes.get("/sessions", authenticate_1.authenticate, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var credential, sessions;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, UserCredential_1.UserCredential.findOne({
                    user: req.user._id,
                    removed: false,
                })];
            case 1:
                credential = _b.sent();
                sessions = ((_a = credential === null || credential === void 0 ? void 0 : credential.sessions) !== null && _a !== void 0 ? _a : []).map(function (session) { return ({
                    sessionId: session.sessionId,
                    current: session.sessionId === req.sessionId,
                    expiresAt: session.expiresAt,
                    createdAt: session.createdAt,
                    lastUsedAt: session.lastUsedAt,
                    ip: session.ip,
                    userAgent: session.userAgent,
                }); });
                res.json({ success: true, result: sessions });
                return [2 /*return*/];
        }
    });
}); }));
exports.authRoutes.delete("/sessions/:sessionId", authenticate_1.authenticate, (0, validate_1.validate)({ params: schemas_1.authSchemas.sessionParams }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, UserCredential_1.UserCredential.updateOne({ user: req.user._id }, { $pull: { sessions: { sessionId: req.params.sessionId } } })];
            case 1:
                _a.sent();
                if (req.params.sessionId === req.sessionId)
                    clearRefreshCookie(res);
                res.json({ success: true, result: null });
                return [2 /*return*/];
        }
    });
}); }));
exports.authRoutes.post("/logout", (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var refreshToken;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                refreshToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a[(0, env_1.getEnv)().REFRESH_COOKIE_NAME];
                if (!refreshToken) return [3 /*break*/, 2];
                return [4 /*yield*/, UserCredential_1.UserCredential.updateOne({
                        "sessions.refreshTokenHash": (0, authService_1.hashOpaqueToken)(refreshToken),
                        removed: false,
                    }, {
                        $pull: {
                            sessions: { refreshTokenHash: (0, authService_1.hashOpaqueToken)(refreshToken) },
                        },
                    })];
            case 1:
                _b.sent();
                _b.label = 2;
            case 2:
                clearRefreshCookie(res);
                res.json({ success: true, result: null });
                return [2 /*return*/];
        }
    });
}); }));
exports.authRoutes.post("/logout-all", authenticate_1.authenticate, (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, UserCredential_1.UserCredential.updateOne({ user: req.user._id }, { $set: { sessions: [] } })];
            case 1:
                _a.sent();
                clearRefreshCookie(res);
                res.json({ success: true, result: null });
                return [2 /*return*/];
        }
    });
}); }));
function createSession(user, credential, req) {
    return __awaiter(this, void 0, void 0, function () {
        var created;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    created = (0, authService_1.createRefreshSession)({
                        ip: req.ip,
                        userAgent: req.get("user-agent"),
                    });
                    credential.sessions.push(created.session);
                    credential.sessions = credential.sessions
                        .filter(function (session) { return session.expiresAt.getTime() > Date.now(); })
                        .sort(function (a, b) { return b.lastUsedAt.getTime() - a.lastUsedAt.getTime(); })
                        .slice(0, 10);
                    return [4 /*yield*/, credential.save()];
                case 1:
                    _a.sent();
                    return [2 /*return*/, {
                            refreshToken: created.refreshToken,
                            accessToken: (0, authService_1.issueAuthToken)(user, created.session.sessionId),
                        }];
            }
        });
    });
}
function createVerification(credential) {
    return __awaiter(this, void 0, void 0, function () {
        var token;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    token = (0, authService_1.createOpaqueToken)();
                    credential.verificationTokenHash = (0, authService_1.hashOpaqueToken)(token);
                    credential.verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    return [4 /*yield*/, credential.save()];
                case 1:
                    _a.sent();
                    return [2 /*return*/, token];
            }
        });
    });
}
function setRefreshCookie(res, refreshToken) {
    var env = (0, env_1.getEnv)();
    res.cookie(env.REFRESH_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: "lax",
        path: "/api/auth",
        maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    });
}
function clearRefreshCookie(res) {
    var env = (0, env_1.getEnv)();
    res.clearCookie(env.REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: "lax",
        path: "/api/auth",
    });
}
function sessionResponse(user, accessToken) {
    return {
        user: publicUser(user),
        accessToken: accessToken,
    };
}
function publicUser(user) {
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
