"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
var mongoose_1 = require("mongoose");
var userSchema = new mongoose_1.Schema({
    workspace: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    client: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Client' },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    surname: { type: String, trim: true },
    photo: { type: String, trim: true },
    role: {
        type: String,
        enum: ['owner', 'manager', 'member', 'client'],
        default: 'member',
        index: true,
    },
    enabled: { type: Boolean, default: true },
    removed: { type: Boolean, default: false },
    lastSeenAt: Date,
}, {
    timestamps: true,
    collection: 'users',
});
userSchema.index({ email: 1 }, { unique: true });
exports.User = (_a = mongoose_1.models.User) !== null && _a !== void 0 ? _a : (0, mongoose_1.model)('User', userSchema);
