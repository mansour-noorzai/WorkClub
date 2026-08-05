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
exports.teamRoutes = void 0;
var crypto_1 = require("crypto");
var express_1 = require("express");
var authorize_1 = require("../middleware/authorize");
var validate_1 = require("../middleware/validate");
var Client_1 = require("../models/Client");
var Invite_1 = require("../models/Invite");
var Project_1 = require("../models/Project");
var Task_1 = require("../models/Task");
var TimeEntry_1 = require("../models/TimeEntry");
var User_1 = require("../models/User");
var Workspace_1 = require("../models/Workspace");
var env_1 = require("../config/env");
var emailService_1 = require("../services/emailService");
var apiError_1 = require("../utils/apiError");
var asyncHandler_1 = require("../utils/asyncHandler");
var schemas_1 = require("../validation/schemas");
exports.teamRoutes = (0, express_1.Router)();
exports.teamRoutes.use((0, authorize_1.authorize)("owner", "manager"));
exports.teamRoutes.get("/", (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, allUsers, allInvites, users, invites;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, Promise.all([
                    User_1.User.find({
                        workspace: req.user.workspace,
                        removed: false,
                    })
                        .select("-__v")
                        .sort({ role: 1, name: 1 })
                        .lean(),
                    Invite_1.Invite.find({
                        workspace: req.user.workspace,
                        status: "pending",
                    })
                        .select("-tokenHash")
                        .sort({ createdAt: -1 })
                        .lean(),
                ])];
            case 1:
                _a = _b.sent(), allUsers = _a[0], allInvites = _a[1];
                users = allUsers.filter(function (user) {
                    return ["owner", "manager", "member"].includes(user.role);
                });
                invites = allInvites.filter(function (invite) {
                    return ["manager", "member"].includes(invite.role);
                });
                res.json({ success: true, result: { users: users, invites: invites } });
                return [2 /*return*/];
        }
    });
}); }));
exports.teamRoutes.post("/invite", (0, validate_1.validate)({ body: schemas_1.teamSchemas.invite }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var exists, token, invite, workspace, inviteUrl, emailStatus;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (req.user.role === "manager" && req.body.role !== "member") {
                    throw new apiError_1.ApiError(403, "Managers can only invite Members.");
                }
                if (!(req.body.role === "client")) return [3 /*break*/, 2];
                return [4 /*yield*/, Client_1.Client.exists(__assign({ _id: req.body.client }, (0, authorize_1.workspaceScope)(req)))];
            case 1:
                exists = _b.sent();
                if (!exists)
                    throw new apiError_1.ApiError(422, "Client does not belong to this workspace.");
                _b.label = 2;
            case 2: return [4 /*yield*/, User_1.User.exists({ email: req.body.email.toLowerCase(), removed: false })];
            case 3:
                if (_b.sent()) {
                    throw new apiError_1.ApiError(409, "An account with this email already exists.");
                }
                return [4 /*yield*/, Invite_1.Invite.updateMany({
                        workspace: req.user.workspace,
                        email: req.body.email.toLowerCase(),
                        status: "pending",
                    }, { status: "revoked" })];
            case 4:
                _b.sent();
                token = (0, crypto_1.randomBytes)(32).toString("hex");
                return [4 /*yield*/, Invite_1.Invite.create({
                        workspace: req.user.workspace,
                        email: req.body.email.toLowerCase(),
                        role: req.body.role,
                        client: req.body.client,
                        tokenHash: (0, crypto_1.createHash)("sha256").update(token).digest("hex"),
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        invitedBy: req.user._id,
                    })];
            case 5:
                invite = _b.sent();
                return [4 /*yield*/, Workspace_1.Workspace.findById(req.user.workspace).select("name")];
            case 6:
                workspace = _b.sent();
                inviteUrl = "".concat((0, env_1.getEnv)().APP_URL, "/accept-invite?token=").concat(token);
                return [4 /*yield*/, (0, emailService_1.sendInviteEmail)({
                        email: invite.email,
                        inviterName: req.user.name,
                        workspaceName: (_a = workspace === null || workspace === void 0 ? void 0 : workspace.name) !== null && _a !== void 0 ? _a : "your workspace",
                        inviteUrl: inviteUrl,
                    })];
            case 7:
                emailStatus = _b.sent();
                res.status(201).json({
                    success: true,
                    result: __assign({ invite: {
                            _id: invite._id,
                            email: invite.email,
                            role: invite.role,
                            status: invite.status,
                            expiresAt: invite.expiresAt,
                        }, emailStatus: emailStatus }, ((0, env_1.getEnv)().NODE_ENV !== "production" ? { inviteUrl: inviteUrl } : {})),
                });
                return [2 /*return*/];
        }
    });
}); }));
exports.teamRoutes.delete("/invite/:inviteId", (0, validate_1.validate)({ params: schemas_1.teamSchemas.revokeInvite }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var invite;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Invite_1.Invite.findOneAndUpdate({
                    _id: req.params.inviteId,
                    workspace: req.user.workspace,
                    status: "pending",
                }, { status: "revoked" }, { new: true })];
            case 1:
                invite = _a.sent();
                if (!invite)
                    throw new apiError_1.ApiError(404, "Pending invitation not found.");
                res.json({ success: true, result: invite });
                return [2 /*return*/];
        }
    });
}); }));
exports.teamRoutes.delete("/user/:userId", (0, validate_1.validate)({ params: schemas_1.teamSchemas.revokeUser }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, _a, openTask, runningTimer;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, User_1.User.findOne({
                    _id: req.params.userId,
                    workspace: req.user.workspace,
                    removed: false,
                })];
            case 1:
                user = _b.sent();
                if (!user)
                    throw new apiError_1.ApiError(404, "Team member not found.");
                if (user.role === "owner" || user._id.equals(req.user._id)) {
                    throw new apiError_1.ApiError(403, "The workspace owner or current user cannot be revoked.");
                }
                if (req.user.role === "manager" && user.role !== "member") {
                    throw new apiError_1.ApiError(403, "Managers can only revoke Members.");
                }
                return [4 /*yield*/, Promise.all([
                        Task_1.Task.exists({
                            workspace: req.user.workspace,
                            assignee: user._id,
                            removed: false,
                            status: { $ne: "done" },
                        }),
                        TimeEntry_1.TimeEntry.exists({
                            workspace: req.user.workspace,
                            user: user._id,
                            removed: false,
                            running: true,
                        }),
                    ])];
            case 2:
                _a = _b.sent(), openTask = _a[0], runningTimer = _a[1];
                if (openTask || runningTimer) {
                    throw new apiError_1.ApiError(409, "Reassign open tasks and stop running timers before revoking access.");
                }
                user.enabled = false;
                user.removed = true;
                return [4 /*yield*/, user.save()];
            case 3:
                _b.sent();
                return [4 /*yield*/, Project_1.Project.updateMany({ workspace: req.user.workspace, teamMembers: user._id }, { $pull: { teamMembers: user._id } })];
            case 4:
                _b.sent();
                res.json({ success: true, result: user });
                return [2 /*return*/];
        }
    });
}); }));
exports.teamRoutes.get("/portal-access", (0, authorize_1.authorize)("owner"), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, users, invites;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, Promise.all([
                    User_1.User.find({
                        workspace: req.user.workspace,
                        removed: false,
                        role: "client",
                    })
                        .populate("client", "name")
                        .select("name email client enabled createdAt")
                        .lean(),
                    Invite_1.Invite.find({
                        workspace: req.user.workspace,
                        status: "pending",
                        role: "client",
                    })
                        .populate("client", "name")
                        .select("-tokenHash")
                        .lean(),
                ])];
            case 1:
                _a = _b.sent(), users = _a[0], invites = _a[1];
                res.json({ success: true, result: { users: users, invites: invites } });
                return [2 /*return*/];
        }
    });
}); }));
