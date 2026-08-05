import { Schema, model, models, type Model, type Types } from 'mongoose';

export interface IUserCredential {
  user: Types.ObjectId;
  password: string;
  salt: string;
  resetTokenHash?: string;
  resetTokenExpiresAt?: Date;
  verificationTokenHash?: string;
  verificationTokenExpiresAt?: Date;
  emailVerified: boolean;
  authType: 'email';
  sessions: Array<{
    sessionId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    createdAt: Date;
    lastUsedAt: Date;
    ip?: string;
    userAgent?: string;
  }>;
  passwordChangedAt?: Date;
  removed: boolean;
}

const credentialSchema = new Schema<IUserCredential>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    password: { type: String, required: true },
    salt: { type: String, required: true },
    resetTokenHash: String,
    resetTokenExpiresAt: Date,
    verificationTokenHash: String,
    verificationTokenExpiresAt: Date,
    emailVerified: { type: Boolean, default: false },
    authType: { type: String, enum: ['email'], default: 'email' },
    sessions: {
      type: [
        {
          sessionId: { type: String, required: true },
          refreshTokenHash: { type: String, required: true },
          expiresAt: { type: Date, required: true },
          createdAt: { type: Date, required: true },
          lastUsedAt: { type: Date, required: true },
          ip: String,
          userAgent: String,
          _id: false,
        },
      ],
      default: [],
    },
    passwordChangedAt: Date,
    removed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'user_credentials',
  }
);

credentialSchema.index({ 'sessions.refreshTokenHash': 1 });
credentialSchema.index({ resetTokenHash: 1 }, { sparse: true });
credentialSchema.index({ verificationTokenHash: 1 }, { sparse: true });

export const UserCredential =
  (models.UserCredential as Model<IUserCredential> | undefined) ??
  model<IUserCredential>('UserCredential', credentialSchema);
