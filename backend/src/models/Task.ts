import { Schema, model, models, type Model, type Types } from 'mongoose';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ITaskComment {
  author: Types.ObjectId;
  message: string;
  createdAt: Date;
}

export interface ITask {
  workspace: Types.ObjectId;
  project: Types.ObjectId;
  title: string;
  description?: string;
  assignee: Types.ObjectId;
  status: TaskStatus;
  dueDate?: Date;
  priority: TaskPriority;
  comments: ITaskComment[];
  sortOrder: number;
  createdBy: Types.ObjectId;
  removed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: String,
    assignee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
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
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        message: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    removed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

taskSchema.index({ workspace: 1, project: 1, status: 1, sortOrder: 1 });
taskSchema.index({ workspace: 1, assignee: 1, dueDate: 1 });

export const Task =
  (models.Task as Model<ITask> | undefined) ?? model<ITask>('Task', taskSchema);
