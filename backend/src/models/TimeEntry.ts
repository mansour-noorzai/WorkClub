import { Schema, model, models, type Types } from 'mongoose';

export interface ITimeEntry {
  workspace: Types.ObjectId;
  project: Types.ObjectId;
  task: Types.ObjectId;
  user: Types.ObjectId;
  startAt: Date;
  endAt?: Date;
  durationMinutes: number;
  billable: boolean;
  running: boolean;
  notes?: string;
  invoice?: Types.ObjectId;
  invoicedAt?: Date;
  invoiceReservation?: string;
  invoiceReservationExpiresAt?: Date;
  removed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const timeEntrySchema = new Schema<ITimeEntry>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startAt: { type: Date, required: true },
    endAt: Date,
    durationMinutes: { type: Number, min: 0, default: 0 },
    billable: { type: Boolean, default: true },
    running: { type: Boolean, default: false, index: true },
    notes: String,
    invoice: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    invoicedAt: Date,
    invoiceReservation: String,
    invoiceReservationExpiresAt: Date,
    removed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

timeEntrySchema.index(
  { workspace: 1, user: 1, running: 1 },
  { unique: true, partialFilterExpression: { running: true, removed: false } }
);
timeEntrySchema.index({ workspace: 1, user: 1, startAt: -1 });
timeEntrySchema.index({ workspace: 1, project: 1, billable: 1, invoice: 1 });
timeEntrySchema.index(
  { invoiceReservationExpiresAt: 1 },
  { partialFilterExpression: { invoiceReservationExpiresAt: { $type: 'date' } } }
);

export const TimeEntry =
  models.TimeEntry ?? model<ITimeEntry>('TimeEntry', timeEntrySchema);
