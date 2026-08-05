import { Schema, model, models, type Types } from 'mongoose';

export type ProjectStatus = 'planned' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export interface IProject {
  workspace: Types.ObjectId;
  client: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  teamMembers: Types.ObjectId[];
  status: ProjectStatus;
  deadline?: Date;
  budget: {
    amount: number;
    currency: string;
  };
  createdBy: Types.ObjectId;
  removed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    description: String,
    teamMembers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
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
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    removed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

projectSchema.index({ workspace: 1, code: 1 }, { unique: true });
projectSchema.index({ workspace: 1, teamMembers: 1, status: 1 });

export const Project = models.Project ?? model<IProject>('Project', projectSchema);
