import { Schema, model, models, type Types } from 'mongoose';

export interface IClient {
  workspace: Types.ObjectId;
  name: string;
  primaryContact: {
    name: string;
    email?: string;
    phone?: string;
    title?: string;
  };
  companySize: 'solo' | '2-10' | '11-50' | '51-200' | '201+';
  status: 'lead' | 'active' | 'archived';
  country?: string;
  address?: string;
  notes?: string;
  createdBy: Types.ObjectId;
  removed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
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
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    removed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

clientSchema.index({ workspace: 1, status: 1, name: 1 });

export const Client = models.Client ?? model<IClient>('Client', clientSchema);
