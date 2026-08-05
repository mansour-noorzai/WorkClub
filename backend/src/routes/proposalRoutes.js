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
exports.proposalRoutes = void 0;
var express_1 = require("express");
var authorize_1 = require("../middleware/authorize");
var validate_1 = require("../middleware/validate");
var Client_1 = require("../models/Client");
var Project_1 = require("../models/Project");
var Proposal_1 = require("../models/Proposal");
var invoiceService_1 = require("../services/invoiceService");
var apiError_1 = require("../utils/apiError");
var asyncHandler_1 = require("../utils/asyncHandler");
var pagination_1 = require("../utils/pagination");
var schemas_1 = require("../validation/schemas");
exports.proposalRoutes = (0, express_1.Router)();
exports.proposalRoutes.use((0, authorize_1.authorize)('owner', 'manager'));
exports.proposalRoutes.get('/', (0, validate_1.validate)({ query: schemas_1.proposalSchemas.list }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, page, limit, skip, _b, search, status, query, _c, items, total;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _a = (0, pagination_1.pagination)(req.query), page = _a.page, limit = _a.limit, skip = _a.skip;
                _b = req.query, search = _b.search, status = _b.status;
                query = (0, authorize_1.workspaceScope)(req);
                if (status)
                    query.status = status;
                if (search)
                    query.title = { $regex: escapeRegex(search), $options: 'i' };
                return [4 /*yield*/, Promise.all([
                        Proposal_1.Proposal.find(query)
                            .populate('client', 'name primaryContact')
                            .populate('project', 'name code')
                            .sort({ createdAt: -1 })
                            .skip(skip)
                            .limit(limit)
                            .lean(),
                        Proposal_1.Proposal.countDocuments(query),
                    ])];
            case 1:
                _c = _d.sent(), items = _c[0], total = _c[1];
                res.json({ success: true, result: items, meta: { page: page, limit: limit, total: total } });
                return [2 /*return*/];
        }
    });
}); }));
exports.proposalRoutes.post('/', (0, validate_1.validate)({ body: schemas_1.proposalSchemas.create }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var project, calculated, proposal;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Client_1.Client.exists(__assign({ _id: req.body.client }, (0, authorize_1.workspaceScope)(req)))];
            case 1:
                if (!(_a.sent())) {
                    throw new apiError_1.ApiError(422, 'Client does not belong to this workspace.');
                }
                if (!req.body.project) return [3 /*break*/, 3];
                return [4 /*yield*/, Project_1.Project.exists(__assign({ _id: req.body.project, client: req.body.client }, (0, authorize_1.workspaceScope)(req)))];
            case 2:
                project = _a.sent();
                if (!project) {
                    throw new apiError_1.ApiError(422, 'Project must belong to the selected client and workspace.');
                }
                _a.label = 3;
            case 3:
                calculated = (0, invoiceService_1.calculateInvoice)(req.body.items);
                return [4 /*yield*/, Proposal_1.Proposal.create(__assign(__assign({}, req.body), { items: calculated.items, total: calculated.subTotal, workspace: req.user.workspace, createdBy: req.user._id }))];
            case 4:
                proposal = _a.sent();
                res.status(201).json({ success: true, result: proposal });
                return [2 /*return*/];
        }
    });
}); }));
exports.proposalRoutes.get('/:id', (0, validate_1.validate)({ params: schemas_1.proposalSchemas.params }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var proposal;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Proposal_1.Proposal.findOne(__assign({ _id: req.params.id }, (0, authorize_1.workspaceScope)(req)))
                    .populate('client', 'name primaryContact')
                    .populate('project', 'name code')
                    .lean()];
            case 1:
                proposal = _a.sent();
                if (!proposal)
                    throw new apiError_1.ApiError(404, 'Proposal not found.');
                res.json({ success: true, result: proposal });
                return [2 /*return*/];
        }
    });
}); }));
exports.proposalRoutes.patch('/:id', (0, validate_1.validate)({ params: schemas_1.proposalSchemas.params, body: schemas_1.proposalSchemas.update }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var previous, proposal;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Proposal_1.Proposal.findOne(__assign({ _id: req.params.id }, (0, authorize_1.workspaceScope)(req)))];
            case 1:
                previous = _a.sent();
                if (!previous)
                    throw new apiError_1.ApiError(404, 'Proposal not found.');
                if (req.body.status && req.body.status !== previous.status) {
                    assertProposalTransition(previous.status, req.body.status);
                }
                return [4 /*yield*/, Proposal_1.Proposal.findOneAndUpdate({ _id: previous._id }, req.body, { new: true, runValidators: true })];
            case 2:
                proposal = _a.sent();
                if (!proposal)
                    throw new apiError_1.ApiError(404, 'Proposal not found.');
                res.json({ success: true, result: proposal });
                return [2 /*return*/];
        }
    });
}); }));
exports.proposalRoutes.delete('/:id', (0, validate_1.validate)({ params: schemas_1.proposalSchemas.params }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var proposal;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Proposal_1.Proposal.findOneAndUpdate(__assign(__assign({ _id: req.params.id }, (0, authorize_1.workspaceScope)(req)), { status: { $in: ['draft', 'declined', 'expired'] } }), { removed: true }, { new: true })];
            case 1:
                proposal = _a.sent();
                if (!proposal)
                    throw new apiError_1.ApiError(409, 'Only draft, declined, or expired proposals can be deleted.');
                res.json({ success: true, result: proposal });
                return [2 /*return*/];
        }
    });
}); }));
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function assertProposalTransition(current, next) {
    var allowed = {
        draft: ['sent'],
        sent: ['accepted', 'declined', 'expired'],
        accepted: [],
        declined: [],
        expired: [],
    };
    if (!allowed[current].includes(next)) {
        throw new apiError_1.ApiError(409, "Proposal status cannot change from ".concat(current, " to ").concat(next, "."));
    }
}
