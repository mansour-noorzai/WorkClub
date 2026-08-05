"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invite = void 0;
var mongoose_1 = require("mongoose");
var inviteSchema = new mongoose_1.Schema({
    workspace: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    email: { type: String, lowercase: true, trim: true, required: true },
    role: { type: String, enum: ['manager', 'member', 'client'], required: true },
    client: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Client' },
    tokenHash: { type: String, required: true, unique: true },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'revoked', 'expired'],
        default: 'pending',
    },
    expiresAt: { type: Date, required: true },
    invitedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
inviteSchema.index({ workspace: 1, email: 1, status: 1 });
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.Invite = (_a = mongoose_1.models.Invite) !== null && _a !== void 0 ? _a : (0, mongoose_1.model)('Invite', inviteSchema);
