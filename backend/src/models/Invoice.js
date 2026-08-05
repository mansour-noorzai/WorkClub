"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invoice = void 0;
var mongoose_1 = require("mongoose");
var invoiceSchema = new mongoose_1.Schema({
    workspace: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    project: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    client: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    number: { type: String, required: true, trim: true },
    issueDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    status: {
        type: String,
        enum: ['draft', 'sent', 'paid', 'overdue', 'void'],
        default: 'draft',
        index: true,
    },
    currency: { type: String, uppercase: true, required: true, default: 'USD' },
    items: [
        {
            description: { type: String, required: true },
            quantity: { type: Number, min: 0, required: true },
            unitPrice: { type: Number, min: 0, required: true },
            total: { type: Number, min: 0, required: true },
            timeEntries: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'TimeEntry' }],
        },
    ],
    subTotal: { type: Number, min: 0, required: true },
    taxRate: { type: Number, min: 0, default: 0 },
    taxTotal: { type: Number, min: 0, default: 0 },
    total: { type: Number, min: 0, required: true },
    notes: String,
    paidAt: Date,
    removed: { type: Boolean, default: false },
}, { timestamps: true });
invoiceSchema.index({ workspace: 1, number: 1 }, { unique: true });
invoiceSchema.index({ workspace: 1, status: 1, dueDate: 1 });
exports.Invoice = (_a = mongoose_1.models.Invoice) !== null && _a !== void 0 ? _a : (0, mongoose_1.model)('Invoice', invoiceSchema);
