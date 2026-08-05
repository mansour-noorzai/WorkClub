"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
var mongoose_1 = require("mongoose");
var notificationSchema = new mongoose_1.Schema({
    workspace: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
        type: String,
        enum: [
            'task_assigned',
            'deadline_approaching',
            'invoice_paid',
            'invoice_overdue',
            'team_invite',
        ],
        required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    dedupeKey: String,
    readAt: Date,
    metadata: mongoose_1.Schema.Types.Mixed,
    emailStatus: {
        type: String,
        enum: ['not_requested', 'sent', 'failed', 'skipped'],
        default: 'not_requested',
    },
}, { timestamps: true });
notificationSchema.index({ workspace: 1, user: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ workspace: 1, user: 1, dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } });
exports.Notification = (_a = mongoose_1.models.Notification) !== null && _a !== void 0 ? _a : (0, mongoose_1.model)('Notification', notificationSchema);
