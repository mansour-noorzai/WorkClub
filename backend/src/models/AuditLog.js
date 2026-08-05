"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
var mongoose_1 = require("mongoose");
var auditLogSchema = new mongoose_1.Schema({
    workspace: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    actor: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, trim: true },
    resourceType: { type: String, required: true, trim: true },
    resourceId: String,
    requestId: String,
    ip: String,
    userAgent: String,
    statusCode: { type: Number, required: true },
}, {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
});
auditLogSchema.index({ workspace: 1, createdAt: -1 });
auditLogSchema.index({ workspace: 1, actor: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });
exports.AuditLog = (_a = mongoose_1.models.AuditLog) !== null && _a !== void 0 ? _a : (0, mongoose_1.model)('AuditLog', auditLogSchema);
