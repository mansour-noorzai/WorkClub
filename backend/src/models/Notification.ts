import { Schema, model, models, type Types } from 'mongoose';

export type NotificationType =
  | 'task_assigned'
  | 'deadline_approaching'
  | 'invoice_paid'
  | 'invoice_overdue'
  | 'team_invite';

export interface INotification {
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  dedupeKey?: string;
  readAt?: Date;
  metadata?: Record<string, unknown>;
  emailStatus: 'not_requested' | 'sent' | 'failed' | 'skipped';
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'task_assigned',
        'deadline_approaching',
        'invoice_paid',
        'invoice_overdue',
        'team_invite',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    dedupeKey: String,
    readAt: Date,
    metadata: Schema.Types.Mixed,
    emailStatus: {
      type: String,
      enum: ['not_requested', 'sent', 'failed', 'skipped'],
      default: 'not_requested',
    },
  },
  { timestamps: true }
);

notificationSchema.index({ workspace: 1, user: 1, readAt: 1, createdAt: -1 });
notificationSchema.index(
  { workspace: 1, user: 1, dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } }
);

export const Notification =
  models.Notification ?? model<INotification>('Notification', notificationSchema);
