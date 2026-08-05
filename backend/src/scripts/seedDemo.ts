import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { AuditLog } from '../models/AuditLog';
import { Client } from '../models/Client';
import { Invoice } from '../models/Invoice';
import { Notification } from '../models/Notification';
import { Project } from '../models/Project';
import { Proposal } from '../models/Proposal';
import { Task } from '../models/Task';
import { TimeEntry } from '../models/TimeEntry';
import { User } from '../models/User';
import { UserCredential } from '../models/UserCredential';
import { Workspace } from '../models/Workspace';
import { hashPassword } from '../services/authService';

const demoSlug = 'northstar-studio-demo';
const demoPassword = 'WorkClubDemo!2026';

async function main() {
  await connectDatabase();
  const existing = await Workspace.findOne({ slug: demoSlug });
  if (existing) {
    if (!process.argv.includes('--reset')) {
      printCredentials();
      console.log('Demo workspace already exists. Use --reset to rebuild only the demo tenant.');
      await disconnectDatabase();
      return;
    }
    await resetDemo(existing._id);
  }

  const now = new Date();
  const ownerId = new Types.ObjectId();
  const managerId = new Types.ObjectId();
  const memberId = new Types.ObjectId();
  const portalUserId = new Types.ObjectId();
  const workspaceId = new Types.ObjectId();
  const clientId = new Types.ObjectId();
  const secondClientId = new Types.ObjectId();
  const projectId = new Types.ObjectId();
  const secondProjectId = new Types.ObjectId();

  await Workspace.create({
    _id: workspaceId,
    name: 'Northstar Studio',
    slug: demoSlug,
    owner: ownerId,
    settings: {
      timezone: 'Europe/London',
      weekStartsOn: 1,
      currency: 'USD',
      defaultHourlyRate: 95,
      invoicePrefix: 'NS',
    },
  });

  const users = await User.insertMany([
    {
      _id: ownerId,
      workspace: workspaceId,
      name: 'Olivia',
      surname: 'Owner',
      email: 'owner@workclub.demo',
      role: 'owner',
      enabled: true,
    },
    {
      _id: managerId,
      workspace: workspaceId,
      name: 'Marcus',
      surname: 'Manager',
      email: 'manager@workclub.demo',
      role: 'manager',
      enabled: true,
    },
    {
      _id: memberId,
      workspace: workspaceId,
      name: 'Maya',
      surname: 'Member',
      email: 'member@workclub.demo',
      role: 'member',
      enabled: true,
    },
    {
      _id: portalUserId,
      workspace: workspaceId,
      client: clientId,
      name: 'Chris',
      surname: 'Client',
      email: 'client@workclub.demo',
      role: 'client',
      enabled: true,
    },
  ]);

  await UserCredential.insertMany(
    users.map((user) => ({
      user: user._id,
      ...hashPassword(demoPassword),
      emailVerified: true,
      sessions: [],
    }))
  );

  await Client.insertMany([
    {
      _id: clientId,
      workspace: workspaceId,
      name: 'Atlas Coffee Co.',
      primaryContact: {
        name: 'Chris Client',
        email: 'client@workclub.demo',
        title: 'Marketing Director',
      },
      companySize: '11-50',
      status: 'active',
      country: 'United Kingdom',
      createdBy: ownerId,
    },
    {
      _id: secondClientId,
      workspace: workspaceId,
      name: 'Lumen Health',
      primaryContact: {
        name: 'Nora Williams',
        email: 'nora@example.test',
        title: 'Founder',
      },
      companySize: '2-10',
      status: 'lead',
      country: 'Netherlands',
      createdBy: ownerId,
    },
  ]);

  await Project.insertMany([
    {
      _id: projectId,
      workspace: workspaceId,
      client: clientId,
      name: 'Atlas Digital Launch',
      code: 'ATLAS-01',
      description: 'Brand, website and launch campaign for the new Atlas subscription.',
      teamMembers: [ownerId, managerId, memberId],
      status: 'active',
      deadline: addDays(now, 21),
      budget: { amount: 18_500, currency: 'USD' },
      createdBy: ownerId,
    },
    {
      _id: secondProjectId,
      workspace: workspaceId,
      client: secondClientId,
      name: 'Lumen Discovery',
      code: 'LUMEN-01',
      description: 'Discovery and prototype engagement.',
      teamMembers: [ownerId, managerId],
      status: 'planned',
      deadline: addDays(now, 45),
      budget: { amount: 7_500, currency: 'USD' },
      createdBy: managerId,
    },
  ]);

  const tasks = await Task.insertMany([
    {
      workspace: workspaceId,
      project: projectId,
      title: 'Approve launch information architecture',
      description: 'Review navigation and page-level content requirements.',
      assignee: memberId,
      status: 'review',
      dueDate: addDays(now, 2),
      priority: 'high',
      sortOrder: 0,
      createdBy: managerId,
      comments: [{ author: managerId, message: 'Client feedback has been added.', createdAt: now }],
    },
    {
      workspace: workspaceId,
      project: projectId,
      title: 'Build responsive landing page',
      assignee: memberId,
      status: 'in_progress',
      dueDate: addDays(now, 5),
      priority: 'urgent',
      sortOrder: 0,
      createdBy: managerId,
    },
    {
      workspace: workspaceId,
      project: projectId,
      title: 'Prepare analytics plan',
      assignee: managerId,
      status: 'todo',
      dueDate: addDays(now, 8),
      priority: 'medium',
      sortOrder: 0,
      createdBy: ownerId,
    },
    {
      workspace: workspaceId,
      project: secondProjectId,
      title: 'Run stakeholder workshop',
      assignee: managerId,
      status: 'todo',
      dueDate: addDays(now, 12),
      priority: 'high',
      sortOrder: 0,
      createdBy: ownerId,
    },
  ]);

  await TimeEntry.insertMany([
    {
      workspace: workspaceId,
      project: projectId,
      task: tasks[0]._id,
      user: memberId,
      startAt: addDays(now, -2),
      endAt: new Date(addDays(now, -2).getTime() + 120 * 60_000),
      durationMinutes: 120,
      billable: true,
      running: false,
      notes: 'Information architecture review',
    },
    {
      workspace: workspaceId,
      project: projectId,
      task: tasks[1]._id,
      user: memberId,
      startAt: addDays(now, -1),
      endAt: new Date(addDays(now, -1).getTime() + 210 * 60_000),
      durationMinutes: 210,
      billable: true,
      running: false,
      notes: 'Landing page implementation',
    },
  ]);

  await Invoice.create({
    workspace: workspaceId,
    project: projectId,
    client: clientId,
    createdBy: ownerId,
    number: 'NS-1001',
    issueDate: addDays(now, -10),
    dueDate: addDays(now, 10),
    status: 'sent',
    currency: 'USD',
    items: [
      {
        description: 'Discovery and launch strategy',
        quantity: 1,
        unitPrice: 3_800,
        total: 3_800,
        timeEntries: [],
      },
    ],
    subTotal: 3_800,
    taxRate: 0,
    taxTotal: 0,
    total: 3_800,
    notes: 'First project milestone.',
  });

  await Proposal.create({
    workspace: workspaceId,
    client: secondClientId,
    project: secondProjectId,
    title: 'Lumen product discovery',
    number: 'PROP-1001',
    status: 'sent',
    validUntil: addDays(now, 14),
    currency: 'USD',
    items: [
      {
        description: 'Research, workshop and interactive prototype',
        quantity: 1,
        unitPrice: 7_500,
        total: 7_500,
      },
    ],
    total: 7_500,
    createdBy: ownerId,
  });

  await Notification.create({
    workspace: workspaceId,
    user: memberId,
    type: 'task_assigned',
    title: 'Welcome to the Atlas project',
    message: 'Two delivery tasks are ready for you.',
    emailStatus: 'skipped',
  });

  printCredentials();
  console.log('Demo workspace created successfully.');
  await disconnectDatabase();
}

async function resetDemo(workspaceId: Types.ObjectId) {
  const users = await User.find({ workspace: workspaceId }).select('_id');
  const userIds = users.map((user) => user._id);
  await Promise.all([
    AuditLog.deleteMany({ workspace: workspaceId }),
    Notification.deleteMany({ workspace: workspaceId }),
    TimeEntry.deleteMany({ workspace: workspaceId }),
    Task.deleteMany({ workspace: workspaceId }),
    Invoice.deleteMany({ workspace: workspaceId }),
    Proposal.deleteMany({ workspace: workspaceId }),
    Project.deleteMany({ workspace: workspaceId }),
    Client.deleteMany({ workspace: workspaceId }),
    UserCredential.deleteMany({ user: { $in: userIds } }),
    User.deleteMany({ workspace: workspaceId }),
  ]);
  await Workspace.deleteOne({ _id: workspaceId });
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function printCredentials() {
  console.log(`
WorkClub demo accounts
  Owner:   owner@workclub.demo
  Manager: manager@workclub.demo
  Member:  member@workclub.demo
  Client:  client@workclub.demo
  Password for all accounts: ${demoPassword}
`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
