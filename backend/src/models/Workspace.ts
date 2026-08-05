import { Schema, model, models, type Model, type Types } from 'mongoose';

export interface IWorkspace {
  name: string;
  slug: string;
  owner: Types.ObjectId;
  settings: {
    timezone: string;
    weekStartsOn: 0 | 1 | 6;
    currency: string;
    defaultHourlyRate: number;
    invoicePrefix: string;
  };
  removed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true, unique: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    settings: {
      timezone: { type: String, default: 'UTC' },
      weekStartsOn: { type: Number, enum: [0, 1, 6], default: 1 },
      currency: { type: String, uppercase: true, default: 'USD' },
      defaultHourlyRate: { type: Number, min: 0, default: 0 },
      invoicePrefix: { type: String, default: 'INV' },
    },
    removed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Workspace =
  (models.Workspace as Model<IWorkspace> | undefined) ??
  model<IWorkspace>('Workspace', workspaceSchema);
