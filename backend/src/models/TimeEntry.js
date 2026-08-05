"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeEntry = void 0;
var mongoose_1 = require("mongoose");
var timeEntrySchema = new mongoose_1.Schema({
    workspace: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    project: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    task: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startAt: { type: Date, required: true },
    endAt: Date,
    durationMinutes: { type: Number, min: 0, default: 0 },
    billable: { type: Boolean, default: true },
    running: { type: Boolean, default: false, index: true },
    notes: String,
    invoice: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Invoice' },
    invoicedAt: Date,
    invoiceReservation: String,
    invoiceReservationExpiresAt: Date,
    removed: { type: Boolean, default: false },
}, { timestamps: true });
timeEntrySchema.index({ workspace: 1, user: 1, running: 1 }, { unique: true, partialFilterExpression: { running: true, removed: false } });
timeEntrySchema.index({ workspace: 1, user: 1, startAt: -1 });
timeEntrySchema.index({ workspace: 1, project: 1, billable: 1, invoice: 1 });
timeEntrySchema.index({ invoiceReservationExpiresAt: 1 }, { partialFilterExpression: { invoiceReservationExpiresAt: { $type: 'date' } } });
exports.TimeEntry = (_a = mongoose_1.models.TimeEntry) !== null && _a !== void 0 ? _a : (0, mongoose_1.model)('TimeEntry', timeEntrySchema);
