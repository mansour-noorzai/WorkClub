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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectRoutes = void 0;
var express_1 = require("express");
var authorize_1 = require("../middleware/authorize");
var validate_1 = require("../middleware/validate");
var Client_1 = require("../models/Client");
var Project_1 = require("../models/Project");
var Task_1 = require("../models/Task");
var TimeEntry_1 = require("../models/TimeEntry");
var User_1 = require("../models/User");
var apiError_1 = require("../utils/apiError");
var asyncHandler_1 = require("../utils/asyncHandler");
var pagination_1 = require("../utils/pagination");
var schemas_1 = require("../validation/schemas");
exports.projectRoutes = (0, express_1.Router)();
exports.projectRoutes.get('/', (0, authorize_1.authorize)('owner', 'manager', 'member'), (0, validate_1.validate)({ query: schemas_1.projectSchemas.list }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, page, limit, skip, _b, search, status, client, query, _c, items, total;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _a = (0, pagination_1.pagination)(req.query), page = _a.page, limit = _a.limit, skip = _a.skip;
                _b = req.query, search = _b.search, status = _b.status, client = _b.client;
                query = (0, authorize_1.memberProjectScope)(req);
                if (status)
                    query.status = status;
                if (client)
                    query.client = client;
                if (search)
                    query.name = { $regex: escapeRegex(search), $options: 'i' };
                return [4 /*yield*/, Promise.all([
                        Project_1.Project.find(query)
                            .populate('client', 'name status primaryContact')
                            .populate('teamMembers', 'name email photo role')
                            .sort({ updatedAt: -1 })
                            .skip(skip)
                            .limit(limit)
                            .lean(),
                        Project_1.Project.countDocuments(query),
                    ])];
            case 1:
                _c = _d.sent(), items = _c[0], total = _c[1];
                res.json({ success: true, result: items, meta: { page: page, limit: limit, total: total } });
                return [2 /*return*/];
        }
    });
}); }));
exports.projectRoutes.post('/', (0, authorize_1.authorize)('owner', 'manager'), (0, validate_1.validate)({ body: schemas_1.projectSchemas.create }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var teamMembers, project;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                teamMembers = Array.from(new Set(__spreadArray(__spreadArray([], req.body.teamMembers, true), [req.user._id.toString()], false)));
                return [4 /*yield*/, validateRelations(req.user.workspace, req.body.client, teamMembers)];
            case 1:
                _a.sent();
                return [4 /*yield*/, Project_1.Project.create(__assign(__assign({}, req.body), { teamMembers: teamMembers, workspace: req.user.workspace, createdBy: req.user._id }))];
            case 2:
                project = _a.sent();
                res.status(201).json({ success: true, result: project });
                return [2 /*return*/];
        }
    });
}); }));
exports.projectRoutes.get('/:id', (0, authorize_1.authorize)('owner', 'manager', 'member'), (0, validate_1.validate)({ params: schemas_1.projectSchemas.params }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var project;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Project_1.Project.findOne(__assign({ _id: req.params.id }, (0, authorize_1.memberProjectScope)(req)))
                    .populate('client', 'name primaryContact status')
                    .populate('teamMembers', 'name email photo role')
                    .lean()];
            case 1:
                project = _a.sent();
                if (!project)
                    throw new apiError_1.ApiError(404, 'Project not found.');
                res.json({ success: true, result: project });
                return [2 /*return*/];
        }
    });
}); }));
exports.projectRoutes.patch('/:id', (0, authorize_1.authorize)('owner', 'manager'), (0, validate_1.validate)({ params: schemas_1.projectSchemas.params, body: schemas_1.projectSchemas.update }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var existing, _a, project;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                if (!(req.body.client || req.body.teamMembers)) return [3 /*break*/, 5];
                return [4 /*yield*/, Project_1.Project.findOne(__assign({ _id: req.params.id }, (0, authorize_1.workspaceScope)(req)))];
            case 1:
                existing = _d.sent();
                if (!existing)
                    throw new apiError_1.ApiError(404, 'Project not found.');
                _a = req.body.teamMembers;
                if (!_a) return [3 /*break*/, 3];
                return [4 /*yield*/, Task_1.Task.exists({
                        project: existing._id,
                        workspace: req.user.workspace,
                        removed: false,
                        status: { $ne: 'done' },
                        assignee: { $nin: req.body.teamMembers },
                    })];
            case 2:
                _a = (_d.sent());
                _d.label = 3;
            case 3:
                if (_a) {
                    throw new apiError_1.ApiError(409, 'Reassign or complete open tasks before removing project members.');
                }
                return [4 /*yield*/, validateRelations(req.user.workspace, (_b = req.body.client) !== null && _b !== void 0 ? _b : existing.client.toString(), (_c = req.body.teamMembers) !== null && _c !== void 0 ? _c : existing.teamMembers.map(String))];
            case 4:
                _d.sent();
                _d.label = 5;
            case 5: return [4 /*yield*/, Project_1.Project.findOneAndUpdate(__assign({ _id: req.params.id }, (0, authorize_1.workspaceScope)(req)), req.body, { new: true, runValidators: true })];
            case 6:
                project = _d.sent();
                if (!project)
                    throw new apiError_1.ApiError(404, 'Project not found.');
                res.json({ success: true, result: project });
                return [2 /*return*/];
        }
    });
}); }));
exports.projectRoutes.delete('/:id', (0, authorize_1.authorize)('owner', 'manager'), (0, validate_1.validate)({ params: schemas_1.projectSchemas.params }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var project;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, TimeEntry_1.TimeEntry.exists(__assign(__assign({ project: req.params.id }, (0, authorize_1.workspaceScope)(req)), { running: true }))];
            case 1:
                if (_a.sent()) {
                    throw new apiError_1.ApiError(409, 'Stop all running timers before archiving this project.');
                }
                return [4 /*yield*/, Project_1.Project.findOneAndUpdate(__assign({ _id: req.params.id }, (0, authorize_1.workspaceScope)(req)), { removed: true, status: 'cancelled' }, { new: true })];
            case 2:
                project = _a.sent();
                if (!project)
                    throw new apiError_1.ApiError(404, 'Project not found.');
                return [4 /*yield*/, Task_1.Task.updateMany({ project: project._id, workspace: req.user.workspace, removed: false }, { $set: { removed: true } })];
            case 3:
                _a.sent();
                res.json({ success: true, result: project });
                return [2 /*return*/];
        }
    });
}); }));
function validateRelations(workspace, clientId, teamMemberIds) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, client, teamCount;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        Client_1.Client.exists({ _id: clientId, workspace: workspace, removed: false }),
                        User_1.User.countDocuments({
                            _id: { $in: teamMemberIds },
                            workspace: workspace,
                            role: { $in: ['owner', 'manager', 'member'] },
                            removed: false,
                            enabled: true,
                        }),
                    ])];
                case 1:
                    _a = _b.sent(), client = _a[0], teamCount = _a[1];
                    if (!client)
                        throw new apiError_1.ApiError(422, 'Client does not belong to this workspace.');
                    if (teamCount !== teamMemberIds.length) {
                        throw new apiError_1.ApiError(422, 'One or more team members do not belong to this workspace.');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
