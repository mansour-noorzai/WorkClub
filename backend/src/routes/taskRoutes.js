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
exports.taskRoutes = void 0;
var express_1 = require("express");
var authorize_1 = require("../middleware/authorize");
var validate_1 = require("../middleware/validate");
var Project_1 = require("../models/Project");
var Task_1 = require("../models/Task");
var TimeEntry_1 = require("../models/TimeEntry");
var User_1 = require("../models/User");
var notificationService_1 = require("../services/notificationService");
var taskService_1 = require("../services/taskService");
var apiError_1 = require("../utils/apiError");
var asyncHandler_1 = require("../utils/asyncHandler");
var pagination_1 = require("../utils/pagination");
var schemas_1 = require("../validation/schemas");
exports.taskRoutes = (0, express_1.Router)();
exports.taskRoutes.get("/", (0, authorize_1.authorize)("owner", "manager", "member"), (0, validate_1.validate)({ query: schemas_1.taskSchemas.list }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, page, limit, skip, _b, search, project, status, assignee, query, _c, items, total;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _a = (0, pagination_1.pagination)(req.query), page = _a.page, limit = _a.limit, skip = _a.skip;
                _b = req.query, search = _b.search, project = _b.project, status = _b.status, assignee = _b.assignee;
                query = (0, authorize_1.memberTaskScope)(req);
                if (project)
                    query.project = project;
                if (status)
                    query.status = status;
                if (assignee && req.user.role !== "member")
                    query.assignee = assignee;
                if (search)
                    query.title = { $regex: escapeRegex(search), $options: "i" };
                return [4 /*yield*/, Promise.all([
                        Task_1.Task.find(query)
                            .populate("assignee", "name email photo role")
                            .populate("project", "name code")
                            .sort({ status: 1, sortOrder: 1, dueDate: 1 })
                            .skip(skip)
                            .limit(limit)
                            .lean(),
                        Task_1.Task.countDocuments(query),
                    ])];
            case 1:
                _c = _d.sent(), items = _c[0], total = _c[1];
                res.json({ success: true, result: items, meta: { page: page, limit: limit, total: total } });
                return [2 /*return*/];
        }
    });
}); }));
exports.taskRoutes.post("/", (0, authorize_1.authorize)("owner", "manager"), (0, validate_1.validate)({ body: schemas_1.taskSchemas.create }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var task;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, assertTaskRelations(req.user.workspace, req.body.project, req.body.assignee)];
            case 1:
                _a.sent();
                return [4 /*yield*/, taskService_1.taskService.create(__assign(__assign({}, req.body), { workspace: req.user.workspace, createdBy: req.user._id }))];
            case 2:
                task = _a.sent();
                return [4 /*yield*/, (0, notificationService_1.createNotification)({
                        workspace: req.user.workspace,
                        user: task.assignee,
                        type: "task_assigned",
                        title: "New task assigned",
                        message: "You were assigned \u201C".concat(task.title, "\u201D."),
                        metadata: {
                            taskId: task._id.toString(),
                            projectId: task.project.toString(),
                        },
                        dedupeKey: "task-assigned:".concat(task._id, ":").concat(task.assignee, ":").concat(task.updatedAt.getTime()),
                        sendEmail: true,
                    })];
            case 3:
                _a.sent();
                res.status(201).json({ success: true, result: task });
                return [2 /*return*/];
        }
    });
}); }));
exports.taskRoutes.get("/:id", (0, authorize_1.authorize)("owner", "manager", "member"), (0, validate_1.validate)({ params: schemas_1.taskSchemas.params }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var task;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Task_1.Task.findOne(__assign({ _id: req.params.id }, (0, authorize_1.memberTaskScope)(req)))
                    .populate("assignee", "name email photo role")
                    .populate("comments.author", "name photo")
                    .lean()];
            case 1:
                task = _a.sent();
                if (!task)
                    throw new apiError_1.ApiError(404, "Task not found.");
                res.json({ success: true, result: task });
                return [2 /*return*/];
        }
    });
}); }));
exports.taskRoutes.patch("/:id", (0, authorize_1.authorize)("owner", "manager"), (0, validate_1.validate)({ params: schemas_1.taskSchemas.params, body: schemas_1.taskSchemas.update }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var existing, assigneeChanged, task;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Task_1.Task.findOne(__assign({ _id: req.params.id }, (0, authorize_1.workspaceScope)(req)))];
            case 1:
                existing = _a.sent();
                if (!existing)
                    throw new apiError_1.ApiError(404, "Task not found.");
                assigneeChanged = Boolean(req.body.assignee && req.body.assignee !== existing.assignee.toString());
                if (!assigneeChanged) return [3 /*break*/, 3];
                return [4 /*yield*/, assertTaskRelations(req.user.workspace, existing.project.toString(), req.body.assignee)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3: return [4 /*yield*/, taskService_1.taskService.update(__assign({ _id: req.params.id }, (0, authorize_1.workspaceScope)(req)), req.body)];
            case 4:
                task = _a.sent();
                if (!(assigneeChanged && task)) return [3 /*break*/, 6];
                return [4 /*yield*/, (0, notificationService_1.createNotification)({
                        workspace: req.user.workspace,
                        user: task.assignee,
                        type: "task_assigned",
                        title: "Task assigned",
                        message: "You were assigned \u201C".concat(task.title, "\u201D."),
                        metadata: {
                            taskId: task._id.toString(),
                            projectId: task.project.toString(),
                        },
                        dedupeKey: "task-assigned:".concat(task._id, ":").concat(task.assignee, ":").concat(task.updatedAt.getTime()),
                        sendEmail: true,
                    })];
            case 5:
                _a.sent();
                _a.label = 6;
            case 6:
                res.json({ success: true, result: task });
                return [2 /*return*/];
        }
    });
}); }));
exports.taskRoutes.patch("/:id/move", (0, authorize_1.authorize)("owner", "manager", "member"), (0, validate_1.validate)({ params: schemas_1.taskSchemas.params, body: schemas_1.taskSchemas.move }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var task;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, taskService_1.taskService.update(__assign({ _id: req.params.id }, (0, authorize_1.memberTaskScope)(req)), req.body)];
            case 1:
                task = _a.sent();
                if (!task)
                    throw new apiError_1.ApiError(404, "Task not found or not assigned to you.");
                res.json({ success: true, result: task });
                return [2 /*return*/];
        }
    });
}); }));
exports.taskRoutes.post("/:id/comments", (0, authorize_1.authorize)("owner", "manager", "member"), (0, validate_1.validate)({ params: schemas_1.taskSchemas.params, body: schemas_1.taskSchemas.comment }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var task;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, taskService_1.taskService.update(__assign({ _id: req.params.id }, (0, authorize_1.memberTaskScope)(req)), {
                    $push: {
                        comments: { author: req.user._id, message: req.body.message },
                    },
                })];
            case 1:
                task = _a.sent();
                if (!task)
                    throw new apiError_1.ApiError(404, "Task not found or not assigned to you.");
                res.json({ success: true, result: task });
                return [2 /*return*/];
        }
    });
}); }));
exports.taskRoutes.delete("/:id", (0, authorize_1.authorize)("owner", "manager"), (0, validate_1.validate)({ params: schemas_1.taskSchemas.params }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var task;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, TimeEntry_1.TimeEntry.exists(__assign(__assign({ task: req.params.id }, (0, authorize_1.workspaceScope)(req)), { running: true }))];
            case 1:
                if (_a.sent()) {
                    throw new apiError_1.ApiError(409, "Stop the running timer before deleting this task.");
                }
                return [4 /*yield*/, taskService_1.taskService.remove(__assign({ _id: req.params.id }, (0, authorize_1.workspaceScope)(req)))];
            case 2:
                task = _a.sent();
                if (!task)
                    throw new apiError_1.ApiError(404, "Task not found.");
                res.json({ success: true, result: task });
                return [2 /*return*/];
        }
    });
}); }));
function assertTaskRelations(workspace, projectId, assigneeId) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, project, assignee;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        Project_1.Project.findOne({ _id: projectId, workspace: workspace, removed: false }),
                        User_1.User.exists({
                            _id: assigneeId,
                            workspace: workspace,
                            removed: false,
                            enabled: true,
                            role: { $in: ["owner", "manager", "member"] },
                        }),
                    ])];
                case 1:
                    _a = _b.sent(), project = _a[0], assignee = _a[1];
                    if (!project)
                        throw new apiError_1.ApiError(422, "Project does not belong to this workspace.");
                    if (!assignee)
                        throw new apiError_1.ApiError(422, "Assignee does not belong to this workspace.");
                    if (!project.teamMembers.some(function (member) {
                        return member.toString() === assigneeId;
                    })) {
                        throw new apiError_1.ApiError(422, "Assignee must be a member of the project team.");
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
