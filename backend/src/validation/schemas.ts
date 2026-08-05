import { z } from 'zod';
import { idParams, listQuery, objectId } from './common';

const passwordInput = z.string().min(1).max(128);
const password = z
  .string()
  .min(10)
  .max(128)
  .regex(/[a-z]/, 'Password must include a lowercase letter.')
  .regex(/[A-Z]/, 'Password must include an uppercase letter.')
  .regex(/[0-9]/, 'Password must include a number.')
  .regex(/[^A-Za-z0-9]/, 'Password must include a special character.');
const currency = z.string().trim().length(3).transform((value) => value.toUpperCase());
const date = z.coerce.date();

export const authSchemas = {
  login: z.object({ email: z.string().email(), password: passwordInput }).strict(),
  registerWorkspace: z
    .object({
      workspaceName: z.string().trim().min(2).max(80),
      name: z.string().trim().min(2).max(80),
      email: z.string().email(),
      password,
    })
    .strict(),
  acceptInvite: z
    .object({
      token: z.string().min(32),
      name: z.string().trim().min(2).max(80),
      password,
    })
    .strict(),
  refresh: z.object({ refreshToken: z.string().min(32).optional() }).strict(),
  requestPasswordReset: z.object({ email: z.string().email() }).strict(),
  resetPassword: z.object({ token: z.string().min(32), password }).strict(),
  verifyEmail: z.object({ token: z.string().min(32) }).strict(),
  resendVerification: z.object({ email: z.string().email() }).strict(),
  sessionParams: z.object({ sessionId: z.string().uuid() }).strict(),
};

export const clientSchemas = {
  create: z
    .object({
      name: z.string().trim().min(2).max(120),
      primaryContact: z
        .object({
          name: z.string().trim().min(2).max(100),
          email: z.string().email().optional(),
          phone: z.string().trim().max(40).optional(),
          title: z.string().trim().max(80).optional(),
        })
        .strict(),
      companySize: z.enum(['solo', '2-10', '11-50', '51-200', '201+']).default('solo'),
      status: z.enum(['lead', 'active', 'archived']).default('lead'),
      country: z.string().trim().max(80).optional(),
      address: z.string().trim().max(300).optional(),
      notes: z.string().trim().max(3000).optional(),
    })
    .strict(),
  update: z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      primaryContact: z
        .object({
          name: z.string().trim().min(2).max(100),
          email: z.string().email().optional(),
          phone: z.string().trim().max(40).optional(),
          title: z.string().trim().max(80).optional(),
        })
        .strict()
        .optional(),
      companySize: z.enum(['solo', '2-10', '11-50', '51-200', '201+']).optional(),
      status: z.enum(['lead', 'active', 'archived']).optional(),
      country: z.string().trim().max(80).optional(),
      address: z.string().trim().max(300).optional(),
      notes: z.string().trim().max(3000).optional(),
    })
    .strict(),
  list: listQuery.extend({ status: z.enum(['lead', 'active', 'archived']).optional() }).strict(),
  params: idParams,
};

export const projectSchemas = {
  create: z
    .object({
      client: objectId,
      name: z.string().trim().min(2).max(140),
      code: z.string().trim().min(2).max(20),
      description: z.string().trim().max(5000).optional(),
      teamMembers: z.array(objectId).max(100).default([]),
      status: z.enum(['planned', 'active', 'on_hold', 'completed', 'cancelled']).default('planned'),
      deadline: date.optional(),
      budget: z
        .object({ amount: z.number().min(0), currency })
        .strict()
        .default({ amount: 0, currency: 'USD' }),
    })
    .strict(),
  update: z
    .object({
      client: objectId.optional(),
      name: z.string().trim().min(2).max(140).optional(),
      code: z.string().trim().min(2).max(20).optional(),
      description: z.string().trim().max(5000).optional(),
      teamMembers: z.array(objectId).max(100).optional(),
      status: z.enum(['planned', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
      deadline: date.nullable().optional(),
      budget: z.object({ amount: z.number().min(0), currency }).strict().optional(),
    })
    .strict(),
  list: listQuery
    .extend({
      status: z.enum(['planned', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
      client: objectId.optional(),
    })
    .strict(),
  params: idParams,
};

export const taskSchemas = {
  create: z
    .object({
      project: objectId,
      title: z.string().trim().min(2).max(200),
      description: z.string().trim().max(5000).optional(),
      assignee: objectId,
      status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
      dueDate: date.optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
      sortOrder: z.number().int().min(0).default(0),
    })
    .strict(),
  update: z
    .object({
      title: z.string().trim().min(2).max(200).optional(),
      description: z.string().trim().max(5000).optional(),
      assignee: objectId.optional(),
      status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
      dueDate: date.nullable().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      sortOrder: z.number().int().min(0).optional(),
    })
    .strict(),
  move: z
    .object({
      status: z.enum(['todo', 'in_progress', 'review', 'done']),
      sortOrder: z.number().int().min(0),
    })
    .strict(),
  comment: z.object({ message: z.string().trim().min(1).max(2000) }).strict(),
  list: listQuery
    .extend({
      project: objectId.optional(),
      status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
      assignee: objectId.optional(),
    })
    .strict(),
  params: idParams,
};

export const timeEntrySchemas = {
  start: z.object({ task: objectId, billable: z.boolean().default(true), notes: z.string().max(1000).optional() }).strict(),
  stop: z.object({ notes: z.string().max(1000).optional() }).strict(),
  manual: z
    .object({
      task: objectId,
      startAt: date,
      durationMinutes: z.number().int().positive().max(1440),
      billable: z.boolean().default(true),
      notes: z.string().max(1000).optional(),
    })
    .strict()
    .refine((value) => value.startAt.getTime() + value.durationMinutes * 60_000 <= Date.now(), {
      message: 'Manual time entries cannot extend into the future.',
      path: ['startAt'],
    }),
  weekly: z
    .object({
      weekStart: date,
      user: objectId.optional(),
    })
    .strict(),
  billable: z.object({ project: objectId }).strict(),
  params: idParams,
};

const invoiceLine = z
  .object({
    description: z.string().trim().min(1).max(300),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0),
  })
  .strict();

export const invoiceSchemas = {
  create: z
    .object({
      project: objectId,
      number: z.string().trim().min(1).max(40),
      issueDate: date.default(() => new Date()),
      dueDate: date,
      status: z.enum(['draft', 'sent', 'paid', 'overdue', 'void']).default('draft'),
      currency: currency.default('USD'),
      items: z.array(invoiceLine).min(1).max(200),
      taxRate: z.number().min(0).max(100).default(0),
      notes: z.string().trim().max(5000).optional(),
    })
    .strict()
    .refine((value) => value.dueDate >= value.issueDate, {
      message: 'Invoice due date cannot be before its issue date.',
      path: ['dueDate'],
    }),
  fromTime: z
    .object({
      project: objectId,
      timeEntries: z
        .array(objectId)
        .min(1)
        .max(500)
        .refine((items) => new Set(items).size === items.length, {
          message: 'Time entries must be unique.',
        }),
      number: z.string().trim().min(1).max(40),
      issueDate: date.default(() => new Date()),
      dueDate: date,
      hourlyRate: z.number().min(0),
      taxRate: z.number().min(0).max(100).default(0),
      notes: z.string().trim().max(5000).optional(),
    })
    .strict()
    .refine((value) => value.dueDate >= value.issueDate, {
      message: 'Invoice due date cannot be before its issue date.',
      path: ['dueDate'],
    }),
  update: z
    .object({
      dueDate: date.optional(),
      status: z.enum(['draft', 'sent', 'paid', 'overdue', 'void']).optional(),
      notes: z.string().trim().max(5000).optional(),
    })
    .strict(),
  list: listQuery
    .extend({
      project: objectId.optional(),
      status: z.enum(['draft', 'sent', 'paid', 'overdue', 'void']).optional(),
    })
    .strict(),
  params: idParams,
};

export const proposalSchemas = {
  create: z
    .object({
      client: objectId,
      project: objectId.optional(),
      title: z.string().trim().min(2).max(200),
      number: z.string().trim().min(1).max(40),
      status: z.enum(['draft', 'sent', 'accepted', 'declined', 'expired']).default('draft'),
      validUntil: date,
      currency: currency.default('USD'),
      items: z.array(invoiceLine).min(1).max(200),
      notes: z.string().trim().max(5000).optional(),
    })
    .strict()
    .refine((value) => value.validUntil.getTime() > Date.now(), {
      message: 'Proposal validity must end in the future.',
      path: ['validUntil'],
    }),
  update: z
    .object({
      title: z.string().trim().min(2).max(200).optional(),
      status: z.enum(['draft', 'sent', 'accepted', 'declined', 'expired']).optional(),
      validUntil: date.optional(),
      notes: z.string().trim().max(5000).optional(),
    })
    .strict()
    .refine((value) => !value.validUntil || value.validUntil.getTime() > Date.now(), {
      message: 'Proposal validity must end in the future.',
      path: ['validUntil'],
    }),
  list: listQuery
    .extend({ status: z.enum(['draft', 'sent', 'accepted', 'declined', 'expired']).optional() })
    .strict(),
  params: idParams,
};

export const teamSchemas = {
  invite: z
    .object({
      email: z.string().email(),
      role: z.enum(['manager', 'member', 'client']),
      client: objectId.optional(),
    })
    .strict()
    .refine((value) => (value.role === 'client' ? Boolean(value.client) : !value.client), {
      message: 'Client portal invitations require a client, and team invitations must not include one.',
    }),
  revokeUser: z.object({ userId: objectId }).strict(),
  revokeInvite: z.object({ inviteId: objectId }).strict(),
};

export const workspaceSchemas = {
  update: z
    .object({
      name: z.string().trim().min(2).max(80).optional(),
      settings: z
        .object({
          timezone: z.string().trim().min(1).max(80).optional(),
          weekStartsOn: z.union([z.literal(0), z.literal(1), z.literal(6)]).optional(),
          currency: currency.optional(),
          defaultHourlyRate: z.number().min(0).optional(),
          invoicePrefix: z.string().trim().min(1).max(10).optional(),
        })
        .strict()
        .optional(),
    })
    .strict(),
};

export const notificationSchemas = {
  list: listQuery.extend({ unreadOnly: z.coerce.boolean().optional() }).strict(),
  params: idParams,
};

export const dashboardSchemas = {
  query: z.object({}).strict(),
};

export const auditSchemas = {
  list: listQuery
    .extend({
      actor: objectId.optional(),
      resourceType: z.string().trim().min(1).max(80).optional(),
    })
    .strict(),
};
