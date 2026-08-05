"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditSchemas = exports.dashboardSchemas = exports.notificationSchemas = exports.workspaceSchemas = exports.teamSchemas = exports.proposalSchemas = exports.invoiceSchemas = exports.timeEntrySchemas = exports.taskSchemas = exports.projectSchemas = exports.clientSchemas = exports.authSchemas = void 0;
var zod_1 = require("zod");
var common_1 = require("./common");
var passwordInput = zod_1.z.string().min(1).max(128);
var password = zod_1.z
    .string()
    .min(10)
    .max(128)
    .regex(/[a-z]/, 'Password must include a lowercase letter.')
    .regex(/[A-Z]/, 'Password must include an uppercase letter.')
    .regex(/[0-9]/, 'Password must include a number.')
    .regex(/[^A-Za-z0-9]/, 'Password must include a special character.');
var currency = zod_1.z.string().trim().length(3).transform(function (value) { return value.toUpperCase(); });
var date = zod_1.z.coerce.date();
exports.authSchemas = {
    login: zod_1.z.object({ email: zod_1.z.string().email(), password: passwordInput }).strict(),
    registerWorkspace: zod_1.z
        .object({
        workspaceName: zod_1.z.string().trim().min(2).max(80),
        name: zod_1.z.string().trim().min(2).max(80),
        email: zod_1.z.string().email(),
        password: password,
    })
        .strict(),
    acceptInvite: zod_1.z
        .object({
        token: zod_1.z.string().min(32),
        name: zod_1.z.string().trim().min(2).max(80),
        password: password,
    })
        .strict(),
    refresh: zod_1.z.object({ refreshToken: zod_1.z.string().min(32).optional() }).strict(),
    requestPasswordReset: zod_1.z.object({ email: zod_1.z.string().email() }).strict(),
    resetPassword: zod_1.z.object({ token: zod_1.z.string().min(32), password: password }).strict(),
    verifyEmail: zod_1.z.object({ token: zod_1.z.string().min(32) }).strict(),
    resendVerification: zod_1.z.object({ email: zod_1.z.string().email() }).strict(),
    sessionParams: zod_1.z.object({ sessionId: zod_1.z.string().uuid() }).strict(),
};
exports.clientSchemas = {
    create: zod_1.z
        .object({
        name: zod_1.z.string().trim().min(2).max(120),
        primaryContact: zod_1.z
            .object({
            name: zod_1.z.string().trim().min(2).max(100),
            email: zod_1.z.string().email().optional(),
            phone: zod_1.z.string().trim().max(40).optional(),
            title: zod_1.z.string().trim().max(80).optional(),
        })
            .strict(),
        companySize: zod_1.z.enum(['solo', '2-10', '11-50', '51-200', '201+']).default('solo'),
        status: zod_1.z.enum(['lead', 'active', 'archived']).default('lead'),
        country: zod_1.z.string().trim().max(80).optional(),
        address: zod_1.z.string().trim().max(300).optional(),
        notes: zod_1.z.string().trim().max(3000).optional(),
    })
        .strict(),
    update: zod_1.z
        .object({
        name: zod_1.z.string().trim().min(2).max(120).optional(),
        primaryContact: zod_1.z
            .object({
            name: zod_1.z.string().trim().min(2).max(100),
            email: zod_1.z.string().email().optional(),
            phone: zod_1.z.string().trim().max(40).optional(),
            title: zod_1.z.string().trim().max(80).optional(),
        })
            .strict()
            .optional(),
        companySize: zod_1.z.enum(['solo', '2-10', '11-50', '51-200', '201+']).optional(),
        status: zod_1.z.enum(['lead', 'active', 'archived']).optional(),
        country: zod_1.z.string().trim().max(80).optional(),
        address: zod_1.z.string().trim().max(300).optional(),
        notes: zod_1.z.string().trim().max(3000).optional(),
    })
        .strict(),
    list: common_1.listQuery.extend({ status: zod_1.z.enum(['lead', 'active', 'archived']).optional() }).strict(),
    params: common_1.idParams,
};
exports.projectSchemas = {
    create: zod_1.z
        .object({
        client: common_1.objectId,
        name: zod_1.z.string().trim().min(2).max(140),
        code: zod_1.z.string().trim().min(2).max(20),
        description: zod_1.z.string().trim().max(5000).optional(),
        teamMembers: zod_1.z.array(common_1.objectId).max(100).default([]),
        status: zod_1.z.enum(['planned', 'active', 'on_hold', 'completed', 'cancelled']).default('planned'),
        deadline: date.optional(),
        budget: zod_1.z
            .object({ amount: zod_1.z.number().min(0), currency: currency })
            .strict()
            .default({ amount: 0, currency: 'USD' }),
    })
        .strict(),
    update: zod_1.z
        .object({
        client: common_1.objectId.optional(),
        name: zod_1.z.string().trim().min(2).max(140).optional(),
        code: zod_1.z.string().trim().min(2).max(20).optional(),
        description: zod_1.z.string().trim().max(5000).optional(),
        teamMembers: zod_1.z.array(common_1.objectId).max(100).optional(),
        status: zod_1.z.enum(['planned', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
        deadline: date.nullable().optional(),
        budget: zod_1.z.object({ amount: zod_1.z.number().min(0), currency: currency }).strict().optional(),
    })
        .strict(),
    list: common_1.listQuery
        .extend({
        status: zod_1.z.enum(['planned', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
        client: common_1.objectId.optional(),
    })
        .strict(),
    params: common_1.idParams,
};
exports.taskSchemas = {
    create: zod_1.z
        .object({
        project: common_1.objectId,
        title: zod_1.z.string().trim().min(2).max(200),
        description: zod_1.z.string().trim().max(5000).optional(),
        assignee: common_1.objectId,
        status: zod_1.z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
        dueDate: date.optional(),
        priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
        sortOrder: zod_1.z.number().int().min(0).default(0),
    })
        .strict(),
    update: zod_1.z
        .object({
        title: zod_1.z.string().trim().min(2).max(200).optional(),
        description: zod_1.z.string().trim().max(5000).optional(),
        assignee: common_1.objectId.optional(),
        status: zod_1.z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
        dueDate: date.nullable().optional(),
        priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        sortOrder: zod_1.z.number().int().min(0).optional(),
    })
        .strict(),
    move: zod_1.z
        .object({
        status: zod_1.z.enum(['todo', 'in_progress', 'review', 'done']),
        sortOrder: zod_1.z.number().int().min(0),
    })
        .strict(),
    comment: zod_1.z.object({ message: zod_1.z.string().trim().min(1).max(2000) }).strict(),
    list: common_1.listQuery
        .extend({
        project: common_1.objectId.optional(),
        status: zod_1.z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
        assignee: common_1.objectId.optional(),
    })
        .strict(),
    params: common_1.idParams,
};
exports.timeEntrySchemas = {
    start: zod_1.z.object({ task: common_1.objectId, billable: zod_1.z.boolean().default(true), notes: zod_1.z.string().max(1000).optional() }).strict(),
    stop: zod_1.z.object({ notes: zod_1.z.string().max(1000).optional() }).strict(),
    manual: zod_1.z
        .object({
        task: common_1.objectId,
        startAt: date,
        durationMinutes: zod_1.z.number().int().positive().max(1440),
        billable: zod_1.z.boolean().default(true),
        notes: zod_1.z.string().max(1000).optional(),
    })
        .strict()
        .refine(function (value) { return value.startAt.getTime() + value.durationMinutes * 60000 <= Date.now(); }, {
        message: 'Manual time entries cannot extend into the future.',
        path: ['startAt'],
    }),
    weekly: zod_1.z
        .object({
        weekStart: date,
        user: common_1.objectId.optional(),
    })
        .strict(),
    billable: zod_1.z.object({ project: common_1.objectId }).strict(),
    params: common_1.idParams,
};
var invoiceLine = zod_1.z
    .object({
    description: zod_1.z.string().trim().min(1).max(300),
    quantity: zod_1.z.number().positive(),
    unitPrice: zod_1.z.number().min(0),
})
    .strict();
exports.invoiceSchemas = {
    create: zod_1.z
        .object({
        project: common_1.objectId,
        number: zod_1.z.string().trim().min(1).max(40),
        issueDate: date.default(function () { return new Date(); }),
        dueDate: date,
        status: zod_1.z.enum(['draft', 'sent', 'paid', 'overdue', 'void']).default('draft'),
        currency: currency.default('USD'),
        items: zod_1.z.array(invoiceLine).min(1).max(200),
        taxRate: zod_1.z.number().min(0).max(100).default(0),
        notes: zod_1.z.string().trim().max(5000).optional(),
    })
        .strict()
        .refine(function (value) { return value.dueDate >= value.issueDate; }, {
        message: 'Invoice due date cannot be before its issue date.',
        path: ['dueDate'],
    }),
    fromTime: zod_1.z
        .object({
        project: common_1.objectId,
        timeEntries: zod_1.z
            .array(common_1.objectId)
            .min(1)
            .max(500)
            .refine(function (items) { return new Set(items).size === items.length; }, {
            message: 'Time entries must be unique.',
        }),
        number: zod_1.z.string().trim().min(1).max(40),
        issueDate: date.default(function () { return new Date(); }),
        dueDate: date,
        hourlyRate: zod_1.z.number().min(0),
        taxRate: zod_1.z.number().min(0).max(100).default(0),
        notes: zod_1.z.string().trim().max(5000).optional(),
    })
        .strict()
        .refine(function (value) { return value.dueDate >= value.issueDate; }, {
        message: 'Invoice due date cannot be before its issue date.',
        path: ['dueDate'],
    }),
    update: zod_1.z
        .object({
        dueDate: date.optional(),
        status: zod_1.z.enum(['draft', 'sent', 'paid', 'overdue', 'void']).optional(),
        notes: zod_1.z.string().trim().max(5000).optional(),
    })
        .strict(),
    list: common_1.listQuery
        .extend({
        project: common_1.objectId.optional(),
        status: zod_1.z.enum(['draft', 'sent', 'paid', 'overdue', 'void']).optional(),
    })
        .strict(),
    params: common_1.idParams,
};
exports.proposalSchemas = {
    create: zod_1.z
        .object({
        client: common_1.objectId,
        project: common_1.objectId.optional(),
        title: zod_1.z.string().trim().min(2).max(200),
        number: zod_1.z.string().trim().min(1).max(40),
        status: zod_1.z.enum(['draft', 'sent', 'accepted', 'declined', 'expired']).default('draft'),
        validUntil: date,
        currency: currency.default('USD'),
        items: zod_1.z.array(invoiceLine).min(1).max(200),
        notes: zod_1.z.string().trim().max(5000).optional(),
    })
        .strict()
        .refine(function (value) { return value.validUntil.getTime() > Date.now(); }, {
        message: 'Proposal validity must end in the future.',
        path: ['validUntil'],
    }),
    update: zod_1.z
        .object({
        title: zod_1.z.string().trim().min(2).max(200).optional(),
        status: zod_1.z.enum(['draft', 'sent', 'accepted', 'declined', 'expired']).optional(),
        validUntil: date.optional(),
        notes: zod_1.z.string().trim().max(5000).optional(),
    })
        .strict()
        .refine(function (value) { return !value.validUntil || value.validUntil.getTime() > Date.now(); }, {
        message: 'Proposal validity must end in the future.',
        path: ['validUntil'],
    }),
    list: common_1.listQuery
        .extend({ status: zod_1.z.enum(['draft', 'sent', 'accepted', 'declined', 'expired']).optional() })
        .strict(),
    params: common_1.idParams,
};
exports.teamSchemas = {
    invite: zod_1.z
        .object({
        email: zod_1.z.string().email(),
        role: zod_1.z.enum(['manager', 'member', 'client']),
        client: common_1.objectId.optional(),
    })
        .strict()
        .refine(function (value) { return (value.role === 'client' ? Boolean(value.client) : !value.client); }, {
        message: 'Client portal invitations require a client, and team invitations must not include one.',
    }),
    revokeUser: zod_1.z.object({ userId: common_1.objectId }).strict(),
    revokeInvite: zod_1.z.object({ inviteId: common_1.objectId }).strict(),
};
exports.workspaceSchemas = {
    update: zod_1.z
        .object({
        name: zod_1.z.string().trim().min(2).max(80).optional(),
        settings: zod_1.z
            .object({
            timezone: zod_1.z.string().trim().min(1).max(80).optional(),
            weekStartsOn: zod_1.z.union([zod_1.z.literal(0), zod_1.z.literal(1), zod_1.z.literal(6)]).optional(),
            currency: currency.optional(),
            defaultHourlyRate: zod_1.z.number().min(0).optional(),
            invoicePrefix: zod_1.z.string().trim().min(1).max(10).optional(),
        })
            .strict()
            .optional(),
    })
        .strict(),
};
exports.notificationSchemas = {
    list: common_1.listQuery.extend({ unreadOnly: zod_1.z.coerce.boolean().optional() }).strict(),
    params: common_1.idParams,
};
exports.dashboardSchemas = {
    query: zod_1.z.object({}).strict(),
};
exports.auditSchemas = {
    list: common_1.listQuery
        .extend({
        actor: common_1.objectId.optional(),
        resourceType: zod_1.z.string().trim().min(1).max(80).optional(),
    })
        .strict(),
};
