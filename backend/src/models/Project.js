"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = void 0;
var mongoose_1 = require("mongoose");
var projectSchema = new mongoose_1.Schema({
    workspace: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    client: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    description: String,
    teamMembers: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    status: {
        type: String,
        enum: ['planned', 'active', 'on_hold', 'completed', 'cancelled'],
        default: 'planned',
        index: true,
    },
    deadline: Date,
    budget: {
        amount: { type: Number, min: 0, default: 0 },
        currency: { type: String, uppercase: true, default: 'USD' },
    },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    removed: { type: Boolean, default: false },
}, { timestamps: true });
projectSchema.index({ workspace: 1, code: 1 }, { unique: true });
projectSchema.index({ workspace: 1, teamMembers: 1, status: 1 });
exports.Project = (_a = mongoose_1.models.Project) !== null && _a !== void 0 ? _a : (0, mongoose_1.model)('Project', projectSchema);
