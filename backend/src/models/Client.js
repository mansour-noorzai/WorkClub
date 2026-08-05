"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
var mongoose_1 = require("mongoose");
var clientSchema = new mongoose_1.Schema({
    workspace: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    name: { type: String, required: true, trim: true },
    primaryContact: {
        name: { type: String, required: true, trim: true },
        email: { type: String, lowercase: true, trim: true },
        phone: String,
        title: String,
    },
    companySize: {
        type: String,
        enum: ['solo', '2-10', '11-50', '51-200', '201+'],
        default: 'solo',
    },
    status: { type: String, enum: ['lead', 'active', 'archived'], default: 'lead' },
    country: String,
    address: String,
    notes: String,
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    removed: { type: Boolean, default: false },
}, { timestamps: true });
clientSchema.index({ workspace: 1, status: 1, name: 1 });
exports.Client = (_a = mongoose_1.models.Client) !== null && _a !== void 0 ? _a : (0, mongoose_1.model)('Client', clientSchema);
