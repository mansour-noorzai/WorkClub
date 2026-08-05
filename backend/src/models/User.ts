import { Schema, model, models, type Types } from 'mongoose';

export type UserRole = 'owner' | 'manager' | 'member' | 'client';

export interface IUser {
  workspace: Types.ObjectId;
  client?: Types.ObjectId;
  email: string;
  name: string;
  surname?: string;
  photo?: string;
  role: UserRole;
  enabled: boolean;
  removed: boolean;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client' },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    surname: { type: String, trim: true },
    photo: { type: String, trim: true },
    role: {
      type: String,
      enum: ['owner', 'manager', 'member', 'client'],
      default: 'member',
      index: true,
    },
    enabled: { type: Boolean, default: true },
    removed: { type: Boolean, default: false },
    lastSeenAt: Date,
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

userSchema.index({ email: 1 }, { unique: true });

export const User = models.User ?? model<IUser>('User', userSchema);
