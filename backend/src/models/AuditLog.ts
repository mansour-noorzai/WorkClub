import { Schema, model, models, type Types } from 'mongoose';

export interface IAuditLog {
  workspace: Types.ObjectId;
  actor: Types.ObjectId;
  action: string;
  resourceType: string;
  resourceId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  statusCode: number;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, trim: true },
    resourceType: { type: String, required: true, trim: true },
    resourceId: String,
    requestId: String,
    ip: String,
    userAgent: String,
    statusCode: { type: Number, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

auditLogSchema.index({ workspace: 1, createdAt: -1 });
auditLogSchema.index({ workspace: 1, actor: 1, createdAt: -1 });
auditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 365 * 24 * 60 * 60 }
);

export const AuditLog =
  models.AuditLog ?? model<IAuditLog>('AuditLog', auditLogSchema);
