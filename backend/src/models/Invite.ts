import { Schema, model, models, type Types } from 'mongoose';
import type { UserRole } from './User';

export interface IInvite {
  workspace: Types.ObjectId;
  email: string;
  role: Exclude<UserRole, 'owner'>;
  client?: Types.ObjectId;
  tokenHash: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAt: Date;
  invitedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const inviteSchema = new Schema<IInvite>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    email: { type: String, lowercase: true, trim: true, required: true },
    role: { type: String, enum: ['manager', 'member', 'client'], required: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client' },
    tokenHash: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'revoked', 'expired'],
      default: 'pending',
    },
    expiresAt: { type: Date, required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

inviteSchema.index({ workspace: 1, email: 1, status: 1 });
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Invite = models.Invite ?? model<IInvite>('Invite', inviteSchema);
