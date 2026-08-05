import { Schema, model, models, type Types } from 'mongoose';

export interface IInvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  timeEntries: Types.ObjectId[];
}

export interface IInvoice {
  workspace: Types.ObjectId;
  project: Types.ObjectId;
  client: Types.ObjectId;
  createdBy: Types.ObjectId;
  number: string;
  issueDate: Date;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
  currency: string;
  items: IInvoiceLine[];
  subTotal: number;
  taxRate: number;
  taxTotal: number;
  total: number;
  notes?: string;
  paidAt?: Date;
  removed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    number: { type: String, required: true, trim: true },
    issueDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue', 'void'],
      default: 'draft',
      index: true,
    },
    currency: { type: String, uppercase: true, required: true, default: 'USD' },
    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, min: 0, required: true },
        unitPrice: { type: Number, min: 0, required: true },
        total: { type: Number, min: 0, required: true },
        timeEntries: [{ type: Schema.Types.ObjectId, ref: 'TimeEntry' }],
      },
    ],
    subTotal: { type: Number, min: 0, required: true },
    taxRate: { type: Number, min: 0, default: 0 },
    taxTotal: { type: Number, min: 0, default: 0 },
    total: { type: Number, min: 0, required: true },
    notes: String,
    paidAt: Date,
    removed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

invoiceSchema.index({ workspace: 1, number: 1 }, { unique: true });
invoiceSchema.index({ workspace: 1, status: 1, dueDate: 1 });

export const Invoice = models.Invoice ?? model<IInvoice>('Invoice', invoiceSchema);
