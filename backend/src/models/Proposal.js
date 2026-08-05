"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Proposal = void 0;
var mongoose_1 = require("mongoose");
var proposalSchema = new mongoose_1.Schema({
    workspace: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    client: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    project: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project' },
    title: { type: String, required: true, trim: true },
    number: { type: String, required: true, trim: true },
    status: {
        type: String,
        enum: ['draft', 'sent', 'accepted', 'declined', 'expired'],
        default: 'draft',
    },
    validUntil: { type: Date, required: true },
    currency: { type: String, uppercase: true, default: 'USD' },
    items: [
        {
            description: { type: String, required: true },
            quantity: { type: Number, min: 0, required: true },
            unitPrice: { type: Number, min: 0, required: true },
            total: { type: Number, min: 0, required: true },
        },
    ],
    total: { type: Number, min: 0, required: true },
    notes: String,
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    removed: { type: Boolean, default: false },
}, { timestamps: true });
proposalSchema.index({ workspace: 1, number: 1 }, { unique: true });
exports.Proposal = (_a = mongoose_1.models.Proposal) !== null && _a !== void 0 ? _a : (0, mongoose_1.model)('Proposal', proposalSchema);
