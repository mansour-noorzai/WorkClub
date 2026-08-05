import { randomUUID } from 'crypto';
import { Router } from 'express';
import { authorize, workspaceScope } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { Invoice } from '../models/Invoice';
import { Project } from '../models/Project';
import { TimeEntry } from '../models/TimeEntry';
import { User } from '../models/User';
import {
  calculateInvoice,
  timeEntriesToInvoiceLine,
  type DraftLine,
} from '../services/invoiceService';
import { createNotification } from '../services/notificationService';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';
import { pagination } from '../utils/pagination';
import { invoiceSchemas } from '../validation/schemas';

export const invoiceRoutes = Router();
invoiceRoutes.use(authorize('owner', 'manager'));

invoiceRoutes.get(
  '/',
  validate({ query: invoiceSchemas.list }),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req.query as never);
    const { search, status, project } = req.query as Record<string, string | undefined>;
    const query: Record<string, unknown> = workspaceScope(req);
    if (status) query.status = status;
    if (project) query.project = project;
    if (search) query.number = { $regex: escapeRegex(search), $options: 'i' };
    const [items, total] = await Promise.all([
      Invoice.find(query)
        .populate('project', 'name code')
        .populate('client', 'name primaryContact')
        .sort({ issueDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Invoice.countDocuments(query),
    ]);
    res.json({ success: true, result: items, meta: { page, limit, total } });
  })
);

invoiceRoutes.post(
  '/',
  validate({ body: invoiceSchemas.create }),
  asyncHandler(async (req, res) => {
    const project = await Project.findOne({
      _id: req.body.project,
      ...workspaceScope(req),
    });
    if (!project) throw new ApiError(422, 'Project does not belong to this workspace.');
    const calculated = calculateInvoice(req.body.items as DraftLine[], req.body.taxRate);
    const invoice = await Invoice.create({
      ...req.body,
      ...calculated,
      workspace: req.user!.workspace,
      client: project.client,
      createdBy: req.user!._id,
    });
    res.status(201).json({ success: true, result: invoice });
  })
);

invoiceRoutes.post(
  '/from-time',
  validate({ body: invoiceSchemas.fromTime }),
  asyncHandler(async (req, res) => {
    const project = await Project.findOne({
      _id: req.body.project,
      ...workspaceScope(req),
    });
    if (!project) throw new ApiError(422, 'Project does not belong to this workspace.');
    const reservationId = randomUUID();
    const reservationExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const baseEntryQuery = {
      _id: { $in: req.body.timeEntries },
      workspace: req.user!.workspace,
      project: project._id,
      billable: true,
      running: false,
      removed: false,
      invoice: { $exists: false },
      durationMinutes: { $gt: 0 },
      $or: [
        { invoiceReservation: { $exists: false } },
        { invoiceReservationExpiresAt: { $lt: new Date() } },
      ],
    };
    const reserved = await TimeEntry.updateMany(baseEntryQuery, {
      $set: {
        invoiceReservation: reservationId,
        invoiceReservationExpiresAt: reservationExpiresAt,
      },
    });
    if (reserved.modifiedCount !== req.body.timeEntries.length) {
      await releaseInvoiceReservation(reservationId);
      throw new ApiError(422, 'One or more time entries are not billable or are already invoiced.');
    }

    try {
      const entries = await TimeEntry.find({
        invoiceReservation: reservationId,
        workspace: req.user!.workspace,
      });
      if (entries.length !== req.body.timeEntries.length) {
        throw new ApiError(409, 'Unable to reserve all selected time entries.');
      }
      const line = timeEntriesToInvoiceLine(entries, req.body.hourlyRate);
      const calculated = calculateInvoice([line], req.body.taxRate);
      const invoice = await Invoice.create({
        workspace: req.user!.workspace,
        project: project._id,
        client: project.client,
        createdBy: req.user!._id,
        number: req.body.number,
        issueDate: req.body.issueDate,
        dueDate: req.body.dueDate,
        status: 'draft',
        currency: project.budget.currency,
        notes: req.body.notes,
        ...calculated,
      });
      const updateResult = await TimeEntry.updateMany(
        {
          invoiceReservation: reservationId,
          workspace: req.user!.workspace,
          invoice: { $exists: false },
        },
        {
          $set: { invoice: invoice._id, invoicedAt: new Date() },
          $unset: { invoiceReservation: 1, invoiceReservationExpiresAt: 1 },
        }
      );
      if (updateResult.modifiedCount !== entries.length) {
        await Invoice.deleteOne({ _id: invoice._id });
        await releaseInvoiceReservation(reservationId);
        throw new ApiError(409, 'Time entries changed while the invoice was being created.');
      }
      return res.status(201).json({ success: true, result: invoice });
    } catch (error) {
      await releaseInvoiceReservation(reservationId);
      throw error;
    }
  })
);

invoiceRoutes.get(
  '/:id',
  validate({ params: invoiceSchemas.params }),
  asyncHandler(async (req, res) => {
    const invoice = await Invoice.findOne({ _id: req.params.id, ...workspaceScope(req) })
      .populate('project', 'name code deadline')
      .populate('client', 'name primaryContact address')
      .lean();
    if (!invoice) throw new ApiError(404, 'Invoice not found.');
    res.json({ success: true, result: invoice });
  })
);

invoiceRoutes.patch(
  '/:id',
  validate({ params: invoiceSchemas.params, body: invoiceSchemas.update }),
  asyncHandler(async (req, res) => {
    const previous = await Invoice.findOne({ _id: req.params.id, ...workspaceScope(req) });
    if (!previous) throw new ApiError(404, 'Invoice not found.');
    if (req.body.dueDate && req.body.dueDate < previous.issueDate) {
      throw new ApiError(422, 'Invoice due date cannot be before its issue date.');
    }
    const update = { ...req.body } as Record<string, unknown>;
    if (req.body.status && req.body.status !== previous.status) {
      assertInvoiceTransition(previous.status, req.body.status);
      if (req.body.status === 'paid') update.paidAt = new Date();
    }
    const invoice = await Invoice.findOneAndUpdate(
      { _id: previous._id },
      update,
      { new: true, runValidators: true }
    );
    if (req.body.status === 'paid' && previous.status !== 'paid') {
      const portalUsers = await User.find({
        workspace: req.user!.workspace,
        client: previous.client,
        role: 'client',
        removed: false,
        enabled: true,
      }).select('_id');
      await Promise.all(
        portalUsers.map((user) =>
          createNotification({
            workspace: req.user!.workspace,
            user: user._id,
            type: 'invoice_paid',
            title: 'Invoice paid',
            message: `Invoice ${previous.number} was marked as paid.`,
            metadata: { invoiceId: previous._id.toString() },
            dedupeKey: `invoice-paid:${previous._id}`,
            sendEmail: true,
          })
        )
      );
    }
    res.json({ success: true, result: invoice });
  })
);

invoiceRoutes.delete(
  '/:id',
  authorize('owner'),
  validate({ params: invoiceSchemas.params }),
  asyncHandler(async (req, res) => {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, ...workspaceScope(req), status: { $in: ['draft', 'void'] } },
      { removed: true, status: 'void' },
      { new: true }
    );
    if (!invoice) throw new ApiError(404, 'Removable invoice not found.');
    await TimeEntry.updateMany(
      { invoice: invoice._id, workspace: req.user!.workspace },
      {
        $unset: {
          invoice: 1,
          invoicedAt: 1,
          invoiceReservation: 1,
          invoiceReservationExpiresAt: 1,
        },
      }
    );
    res.json({ success: true, result: invoice });
  })
);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function releaseInvoiceReservation(reservationId: string) {
  await TimeEntry.updateMany(
    { invoiceReservation: reservationId, invoice: { $exists: false } },
    { $unset: { invoiceReservation: 1, invoiceReservationExpiresAt: 1 } }
  );
}

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';

function assertInvoiceTransition(current: InvoiceStatus, next: InvoiceStatus) {
  const allowed: Record<InvoiceStatus, InvoiceStatus[]> = {
    draft: ['sent', 'void'],
    sent: ['paid', 'overdue', 'void'],
    overdue: ['paid', 'void'],
    paid: [],
    void: [],
  } satisfies Record<typeof current, Array<typeof next>>;
  if (!allowed[current].includes(next)) {
    throw new ApiError(409, `Invoice status cannot change from ${current} to ${next}.`);
  }
}
