"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCredential = void 0;
var mongoose_1 = require("mongoose");
var credentialSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    password: { type: String, required: true },
    salt: { type: String, required: true },
    resetTokenHash: String,
    resetTokenExpiresAt: Date,
    verificationTokenHash: String,
    verificationTokenExpiresAt: Date,
    emailVerified: { type: Boolean, default: false },
    authType: { type: String, enum: ['email'], default: 'email' },
    sessions: {
        type: [
            {
                sessionId: { type: String, required: true },
                refreshTokenHash: { type: String, required: true },
                expiresAt: { type: Date, required: true },
                createdAt: { type: Date, required: true },
                lastUsedAt: { type: Date, required: true },
                ip: String,
                userAgent: String,
                _id: false,
            },
        ],
        default: [],
    },
    passwordChangedAt: Date,
    removed: { type: Boolean, default: false },
}, {
    timestamps: true,
    collection: 'user_credentials',
});
credentialSchema.index({ 'sessions.refreshTokenHash': 1 });
credentialSchema.index({ resetTokenHash: 1 }, { sparse: true });
credentialSchema.index({ verificationTokenHash: 1 }, { sparse: true });
exports.UserCredential = (_a = mongoose_1.models.UserCredential) !== null && _a !== void 0 ? _a : (0, mongoose_1.model)('UserCredential', credentialSchema);
