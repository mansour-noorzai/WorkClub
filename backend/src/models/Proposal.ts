import { Schema, model, models, type Types } from 'mongoose';

export interface IProposal {
  workspace: Types.ObjectId;
  client: Types.ObjectId;
  project?: Types.ObjectId;
  title: string;
  number: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';
  validUntil: Date;
  currency: string;
  items: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  total: number;
  notes?: string;
  createdBy: Types.ObjectId;
  removed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const proposalSchema = new Schema<IProposal>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
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
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    removed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

proposalSchema.index({ workspace: 1, number: 1 }, { unique: true });

export const Proposal = models.Proposal ?? model<IProposal>('Proposal', proposalSchema);
