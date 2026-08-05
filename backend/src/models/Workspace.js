"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Workspace = void 0;
var mongoose_1 = require("mongoose");
var workspaceSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true, unique: true },
    owner: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    settings: {
        timezone: { type: String, default: 'UTC' },
        weekStartsOn: { type: Number, enum: [0, 1, 6], default: 1 },
        currency: { type: String, uppercase: true, default: 'USD' },
        defaultHourlyRate: { type: Number, min: 0, default: 0 },
        invoicePrefix: { type: String, default: 'INV' },
    },
    removed: { type: Boolean, default: false },
}, { timestamps: true });
exports.Workspace = (_a = mongoose_1.models.Workspace) !== null && _a !== void 0 ? _a : (0, mongoose_1.model)('Workspace', workspaceSchema);
