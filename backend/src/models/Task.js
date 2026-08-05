"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
var mongoose_1 = require("mongoose");
var taskSchema = new mongoose_1.Schema({
    workspace: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    project: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: String,
    assignee: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
        type: String,
        enum: ['todo', 'in_progress', 'review', 'done'],
        default: 'todo',
        index: true,
    },
    dueDate: Date,
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
    },
    comments: [
        {
            author: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
            message: { type: String, required: true, trim: true },
            createdAt: { type: Date, default: Date.now },
        },
    ],
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    removed: { type: Boolean, default: false },
}, { timestamps: true });
taskSchema.index({ workspace: 1, project: 1, status: 1, sortOrder: 1 });
taskSchema.index({ workspace: 1, assignee: 1, dueDate: 1 });
exports.Task = (_a = mongoose_1.models.Task) !== null && _a !== void 0 ? _a : (0, mongoose_1.model)('Task', taskSchema);
