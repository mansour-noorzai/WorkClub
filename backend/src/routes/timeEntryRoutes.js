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
exports.timeEntryRoutes = void 0;
var express_1 = require("express");
var authorize_1 = require("../middleware/authorize");
var validate_1 = require("../middleware/validate");
var Task_1 = require("../models/Task");
var TimeEntry_1 = require("../models/TimeEntry");
var apiError_1 = require("../utils/apiError");
var asyncHandler_1 = require("../utils/asyncHandler");
var schemas_1 = require("../validation/schemas");
exports.timeEntryRoutes = (0, express_1.Router)();
exports.timeEntryRoutes.use((0, authorize_1.authorize)("owner", "manager", "member"));
exports.timeEntryRoutes.post("/start", (0, validate_1.validate)({ body: schemas_1.timeEntrySchemas.start }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var task, entry;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Task_1.Task.findOne(__assign({ _id: req.body.task }, (0, authorize_1.memberTaskScope)(req)))];
            case 1:
                task = _a.sent();
                if (!task)
                    throw new apiError_1.ApiError(404, "Task not found or not assigned to you.");
                return [4 /*yield*/, TimeEntry_1.TimeEntry.exists(__assign(__assign({}, (0, authorize_1.workspaceScope)(req)), { user: req.user._id, running: true }))];
            case 2:
                if (_a.sent()) {
                    throw new apiError_1.ApiError(409, "Stop your current timer before starting another.");
                }
                return [4 /*yield*/, TimeEntry_1.TimeEntry.create({
                        workspace: req.user.workspace,
                        project: task.project,
                        task: task._id,
                        user: req.user._id,
                        startAt: new Date(),
                        running: true,
                        billable: req.body.billable,
                        notes: req.body.notes,
                    })];
            case 3:
                entry = _a.sent();
                res.status(201).json({ success: true, result: entry });
                return [2 /*return*/];
        }
    });
}); }));
exports.timeEntryRoutes.patch("/:id/stop", (0, validate_1.validate)({ params: schemas_1.timeEntrySchemas.params, body: schemas_1.timeEntrySchemas.stop }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var entry, endAt;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, TimeEntry_1.TimeEntry.findOne(__assign(__assign({ _id: req.params.id }, (0, authorize_1.workspaceScope)(req)), { user: req.user._id, running: true }))];
            case 1:
                entry = _a.sent();
                if (!entry)
                    throw new apiError_1.ApiError(404, "Running timer not found.");
                endAt = new Date();
                entry.endAt = endAt;
                entry.durationMinutes = Math.max(1, Math.round((endAt.getTime() - entry.startAt.getTime()) / 60000));
                entry.running = false;
                if (req.body.notes !== undefined)
                    entry.notes = req.body.notes;
                return [4 /*yield*/, entry.save()];
            case 2:
                _a.sent();
                res.json({ success: true, result: entry });
                return [2 /*return*/];
        }
    });
}); }));
exports.timeEntryRoutes.post("/manual", (0, validate_1.validate)({ body: schemas_1.timeEntrySchemas.manual }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var task, endAt, entry;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Task_1.Task.findOne(__assign({ _id: req.body.task }, (0, authorize_1.memberTaskScope)(req)))];
            case 1:
                task = _a.sent();
                if (!task)
                    throw new apiError_1.ApiError(404, "Task not found or not assigned to you.");
                endAt = new Date(req.body.startAt.getTime() + req.body.durationMinutes * 60000);
                return [4 /*yield*/, TimeEntry_1.TimeEntry.create(__assign(__assign({}, req.body), { workspace: req.user.workspace, project: task.project, user: req.user._id, endAt: endAt, running: false }))];
            case 2:
                entry = _a.sent();
                res.status(201).json({ success: true, result: entry });
                return [2 /*return*/];
        }
    });
}); }));
exports.timeEntryRoutes.get("/weekly", (0, validate_1.validate)({ query: schemas_1.timeEntrySchemas.weekly }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var weekStart, requestedUser, user, start, end, entries, totalMinutes, billableMinutes;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                weekStart = schemas_1.timeEntrySchemas.weekly.parse(req.query).weekStart;
                requestedUser = req.query.user;
                if (req.user.role === "member" &&
                    requestedUser &&
                    requestedUser !== req.user._id.toString()) {
                    throw new apiError_1.ApiError(403, "Members can only view their own timesheet.");
                }
                user = requestedUser !== null && requestedUser !== void 0 ? requestedUser : req.user._id;
                start = new Date(weekStart);
                end = new Date(start);
                end.setUTCDate(start.getUTCDate() + 7);
                return [4 /*yield*/, TimeEntry_1.TimeEntry.find(__assign(__assign({}, (0, authorize_1.workspaceScope)(req)), { user: user, startAt: { $gte: start, $lt: end } }))
                        .populate("task", "title status")
                        .populate("project", "name code")
                        .sort({ startAt: -1 })
                        .lean()];
            case 1:
                entries = _a.sent();
                totalMinutes = entries.reduce(function (sum, entry) { return sum + entry.durationMinutes; }, 0);
                billableMinutes = entries
                    .filter(function (entry) { return entry.billable; })
                    .reduce(function (sum, entry) { return sum + entry.durationMinutes; }, 0);
                res.json({
                    success: true,
                    result: {
                        entries: entries,
                        totalMinutes: totalMinutes,
                        billableMinutes: billableMinutes,
                        weekStart: weekStart,
                        weekEnd: end,
                    },
                });
                return [2 /*return*/];
        }
    });
}); }));
exports.timeEntryRoutes.get("/running", (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var entry;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, TimeEntry_1.TimeEntry.findOne(__assign(__assign({}, (0, authorize_1.workspaceScope)(req)), { user: req.user._id, running: true }))
                    .populate("task", "title")
                    .lean()];
            case 1:
                entry = _a.sent();
                res.json({ success: true, result: entry });
                return [2 /*return*/];
        }
    });
}); }));
exports.timeEntryRoutes.get("/billable", (0, authorize_1.authorize)("owner", "manager"), (0, validate_1.validate)({ query: schemas_1.timeEntrySchemas.billable }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var entries;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, TimeEntry_1.TimeEntry.find(__assign(__assign({}, (0, authorize_1.workspaceScope)(req)), { project: req.query.project, billable: true, running: false, invoice: { $exists: false }, durationMinutes: { $gt: 0 }, $or: [
                        { invoiceReservation: { $exists: false } },
                        { invoiceReservationExpiresAt: { $lt: new Date() } },
                    ] }))
                    .populate("task", "title")
                    .populate("user", "name")
                    .sort({ startAt: 1 })
                    .lean()];
            case 1:
                entries = _a.sent();
                res.json({ success: true, result: entries });
                return [2 /*return*/];
        }
    });
}); }));
exports.timeEntryRoutes.delete("/:id", (0, validate_1.validate)({ params: schemas_1.timeEntrySchemas.params }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var query, entry;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                query = __assign(__assign({ _id: req.params.id }, (0, authorize_1.workspaceScope)(req)), { invoice: { $exists: false }, running: false });
                if (req.user.role === "member")
                    query.user = req.user._id;
                return [4 /*yield*/, TimeEntry_1.TimeEntry.findOneAndUpdate(query, { removed: true }, { new: true })];
            case 1:
                entry = _a.sent();
                if (!entry)
                    throw new apiError_1.ApiError(404, "Editable time entry not found.");
                res.json({ success: true, result: entry });
                return [2 /*return*/];
        }
    });
}); }));
