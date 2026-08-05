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
exports.invoiceRoutes = void 0;
var crypto_1 = require("crypto");
var express_1 = require("express");
var authorize_1 = require("../middleware/authorize");
var validate_1 = require("../middleware/validate");
var Invoice_1 = require("../models/Invoice");
var Project_1 = require("../models/Project");
var TimeEntry_1 = require("../models/TimeEntry");
var User_1 = require("../models/User");
var invoiceService_1 = require("../services/invoiceService");
var notificationService_1 = require("../services/notificationService");
var apiError_1 = require("../utils/apiError");
var asyncHandler_1 = require("../utils/asyncHandler");
var pagination_1 = require("../utils/pagination");
var schemas_1 = require("../validation/schemas");
exports.invoiceRoutes = (0, express_1.Router)();
exports.invoiceRoutes.use((0, authorize_1.authorize)('owner', 'manager'));
exports.invoiceRoutes.get('/', (0, validate_1.validate)({ query: schemas_1.invoiceSchemas.list }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, page, limit, skip, _b, search, status, project, query, _c, items, total;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _a = (0, pagination_1.pagination)(req.query), page = _a.page, limit = _a.limit, skip = _a.skip;
                _b = req.query, search = _b.search, status = _b.status, project = _b.project;
                query = (0, authorize_1.workspaceScope)(req);
                if (status)
                    query.status = status;
                if (project)
                    query.project = project;
                if (search)
                    query.number = { $regex: escapeRegex(search), $options: 'i' };
                return [4 /*yield*/, Promise.all([
                        Invoice_1.Invoice.find(query)
                            .populate('project', 'name code')
                            .populate('client', 'name primaryContact')
                            .sort({ issueDate: -1 })
                            .skip(skip)
                            .limit(limit)
                            .lean(),
                        Invoice_1.Invoice.countDocuments(query),
                    ])];
            case 1:
                _c = _d.sent(), items = _c[0], total = _c[1];
                res.json({ success: true, result: items, meta: { page: page, limit: limit, total: total } });
                return [2 /*return*/];
        }
    });
}); }));
exports.invoiceRoutes.post('/', (0, validate_1.validate)({ body: schemas_1.invoiceSchemas.create }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var project, calculated, invoice;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Project_1.Project.findOne(__assign({ _id: req.body.project }, (0, authorize_1.workspaceScope)(req)))];
            case 1:
                project = _a.sent();
                if (!project)
                    throw new apiError_1.ApiError(422, 'Project does not belong to this workspace.');
                calculated = (0, invoiceService_1.calculateInvoice)(req.body.items, req.body.taxRate);
                return [4 /*yield*/, Invoice_1.Invoice.create(__assign(__assign(__assign({}, req.body), calculated), { workspace: req.user.workspace, client: project.client, createdBy: req.user._id }))];
            case 2:
                invoice = _a.sent();
                res.status(201).json({ success: true, result: invoice });
                return [2 /*return*/];
        }
    });
}); }));
exports.invoiceRoutes.post('/from-time', (0, validate_1.validate)({ body: schemas_1.invoiceSchemas.fromTime }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var project, reservationId, reservationExpiresAt, baseEntryQuery, reserved, entries, line, calculated, invoice, updateResult, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Project_1.Project.findOne(__assign({ _id: req.body.project }, (0, authorize_1.workspaceScope)(req)))];
            case 1:
                project = _a.sent();
                if (!project)
                    throw new apiError_1.ApiError(422, 'Project does not belong to this workspace.');
                reservationId = (0, crypto_1.randomUUID)();
                reservationExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
                baseEntryQuery = {
                    _id: { $in: req.body.timeEntries },
                    workspace: req.user.workspace,
                    project: project._id,
                    billable: true,
                    running: false,
                    removed: false,
                    invoice: { $exists: false },
                    durationMinutes: { $gt: 0 },
                    $or: [
                        { invoiceReservation: { $exists: false } },
                        { invoiceReservationExpiresAt: { $lt: new Date() } },
                    ],
                };
                return [4 /*yield*/, TimeEntry_1.TimeEntry.updateMany(baseEntryQuery, {
                        $set: {
                            invoiceReservation: reservationId,
                            invoiceReservationExpiresAt: reservationExpiresAt,
                        },
                    })];
            case 2:
                reserved = _a.sent();
                if (!(reserved.modifiedCount !== req.body.timeEntries.length)) return [3 /*break*/, 4];
                return [4 /*yield*/, releaseInvoiceReservation(reservationId)];
            case 3:
                _a.sent();
                throw new apiError_1.ApiError(422, 'One or more time entries are not billable or are already invoiced.');
            case 4:
                _a.trys.push([4, 11, , 13]);
                return [4 /*yield*/, TimeEntry_1.TimeEntry.find({
                        invoiceReservation: reservationId,
                        workspace: req.user.workspace,
                    })];
            case 5:
                entries = _a.sent();
                if (entries.length !== req.body.timeEntries.length) {
                    throw new apiError_1.ApiError(409, 'Unable to reserve all selected time entries.');
                }
                line = (0, invoiceService_1.timeEntriesToInvoiceLine)(entries, req.body.hourlyRate);
                calculated = (0, invoiceService_1.calculateInvoice)([line], req.body.taxRate);
                return [4 /*yield*/, Invoice_1.Invoice.create(__assign({ workspace: req.user.workspace, project: project._id, client: project.client, createdBy: req.user._id, number: req.body.number, issueDate: req.body.issueDate, dueDate: req.body.dueDate, status: 'draft', currency: project.budget.currency, notes: req.body.notes }, calculated))];
            case 6:
                invoice = _a.sent();
                return [4 /*yield*/, TimeEntry_1.TimeEntry.updateMany({
                        invoiceReservation: reservationId,
                        workspace: req.user.workspace,
                        invoice: { $exists: false },
                    }, {
                        $set: { invoice: invoice._id, invoicedAt: new Date() },
                        $unset: { invoiceReservation: 1, invoiceReservationExpiresAt: 1 },
                    })];
            case 7:
                updateResult = _a.sent();
                if (!(updateResult.modifiedCount !== entries.length)) return [3 /*break*/, 10];
                return [4 /*yield*/, Invoice_1.Invoice.deleteOne({ _id: invoice._id })];
            case 8:
                _a.sent();
                return [4 /*yield*/, releaseInvoiceReservation(reservationId)];
            case 9:
                _a.sent();
                throw new apiError_1.ApiError(409, 'Time entries changed while the invoice was being created.');
            case 10: return [2 /*return*/, res.status(201).json({ success: true, result: invoice })];
            case 11:
                error_1 = _a.sent();
                return [4 /*yield*/, releaseInvoiceReservation(reservationId)];
            case 12:
                _a.sent();
                throw error_1;
            case 13: return [2 /*return*/];
        }
    });
}); }));
exports.invoiceRoutes.get('/:id', (0, validate_1.validate)({ params: schemas_1.invoiceSchemas.params }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var invoice;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Invoice_1.Invoice.findOne(__assign({ _id: req.params.id }, (0, authorize_1.workspaceScope)(req)))
                    .populate('project', 'name code deadline')
                    .populate('client', 'name primaryContact address')
                    .lean()];
            case 1:
                invoice = _a.sent();
                if (!invoice)
                    throw new apiError_1.ApiError(404, 'Invoice not found.');
                res.json({ success: true, result: invoice });
                return [2 /*return*/];
        }
    });
}); }));
exports.invoiceRoutes.patch('/:id', (0, validate_1.validate)({ params: schemas_1.invoiceSchemas.params, body: schemas_1.invoiceSchemas.update }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var previous, update, invoice, portalUsers;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Invoice_1.Invoice.findOne(__assign({ _id: req.params.id }, (0, authorize_1.workspaceScope)(req)))];
            case 1:
                previous = _a.sent();
                if (!previous)
                    throw new apiError_1.ApiError(404, 'Invoice not found.');
                if (req.body.dueDate && req.body.dueDate < previous.issueDate) {
                    throw new apiError_1.ApiError(422, 'Invoice due date cannot be before its issue date.');
                }
                update = __assign({}, req.body);
                if (req.body.status && req.body.status !== previous.status) {
                    assertInvoiceTransition(previous.status, req.body.status);
                    if (req.body.status === 'paid')
                        update.paidAt = new Date();
                }
                return [4 /*yield*/, Invoice_1.Invoice.findOneAndUpdate({ _id: previous._id }, update, { new: true, runValidators: true })];
            case 2:
                invoice = _a.sent();
                if (!(req.body.status === 'paid' && previous.status !== 'paid')) return [3 /*break*/, 5];
                return [4 /*yield*/, User_1.User.find({
                        workspace: req.user.workspace,
                        client: previous.client,
                        role: 'client',
                        removed: false,
                        enabled: true,
                    }).select('_id')];
            case 3:
                portalUsers = _a.sent();
                return [4 /*yield*/, Promise.all(portalUsers.map(function (user) {
                        return (0, notificationService_1.createNotification)({
                            workspace: req.user.workspace,
                            user: user._id,
                            type: 'invoice_paid',
                            title: 'Invoice paid',
                            message: "Invoice ".concat(previous.number, " was marked as paid."),
                            metadata: { invoiceId: previous._id.toString() },
                            dedupeKey: "invoice-paid:".concat(previous._id),
                            sendEmail: true,
                        });
                    }))];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5:
                res.json({ success: true, result: invoice });
                return [2 /*return*/];
        }
    });
}); }));
exports.invoiceRoutes.delete('/:id', (0, authorize_1.authorize)('owner'), (0, validate_1.validate)({ params: schemas_1.invoiceSchemas.params }), (0, asyncHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var invoice;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Invoice_1.Invoice.findOneAndUpdate(__assign(__assign({ _id: req.params.id }, (0, authorize_1.workspaceScope)(req)), { status: { $in: ['draft', 'void'] } }), { removed: true, status: 'void' }, { new: true })];
            case 1:
                invoice = _a.sent();
                if (!invoice)
                    throw new apiError_1.ApiError(404, 'Removable invoice not found.');
                return [4 /*yield*/, TimeEntry_1.TimeEntry.updateMany({ invoice: invoice._id, workspace: req.user.workspace }, {
                        $unset: {
                            invoice: 1,
                            invoicedAt: 1,
                            invoiceReservation: 1,
                            invoiceReservationExpiresAt: 1,
                        },
                    })];
            case 2:
                _a.sent();
                res.json({ success: true, result: invoice });
                return [2 /*return*/];
        }
    });
}); }));
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function releaseInvoiceReservation(reservationId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, TimeEntry_1.TimeEntry.updateMany({ invoiceReservation: reservationId, invoice: { $exists: false } }, { $unset: { invoiceReservation: 1, invoiceReservationExpiresAt: 1 } })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function assertInvoiceTransition(current, next) {
    var allowed = {
        draft: ['sent', 'void'],
        sent: ['paid', 'overdue', 'void'],
        overdue: ['paid', 'void'],
        paid: [],
        void: [],
    };
    if (!allowed[current].includes(next)) {
        throw new apiError_1.ApiError(409, "Invoice status cannot change from ".concat(current, " to ").concat(next, "."));
    }
}
