import { Invoice } from '../models/Invoice';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { createNotification } from './notificationService';

export async function runNotificationSweep(now = new Date()) {
  const approaching = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const dayBucket = now.toISOString().slice(0, 10);

  const tasks = await Task.find({
    removed: false,
    status: { $ne: 'done' },
    dueDate: { $gte: now, $lte: approaching },
  }).select('_id workspace assignee title project');

  for (const task of tasks) {
    await createNotification({
      workspace: task.workspace,
      user: task.assignee,
      type: 'deadline_approaching',
      title: 'Task deadline approaching',
      message: `“${task.title}” is due within 48 hours.`,
      metadata: { taskId: task._id.toString(), projectId: task.project.toString() },
      dedupeKey: `task-deadline:${task._id}:${dayBucket}`,
      sendEmail: true,
    });
  }

  const overdueInvoices = await Invoice.find({
    removed: false,
    status: 'sent',
    dueDate: { $lt: now },
  }).select('_id workspace client number');

  let invoicesMarkedOverdue = 0;
  for (const invoice of overdueInvoices) {
    const updated = await Invoice.findOneAndUpdate(
      { _id: invoice._id, status: 'sent', removed: false },
      { $set: { status: 'overdue' } },
      { new: true }
    );
    if (!updated) continue;
    invoicesMarkedOverdue += 1;

    const portalUsers = await User.find({
      workspace: invoice.workspace,
      client: invoice.client,
      role: 'client',
      enabled: true,
      removed: false,
    }).select('_id');

    for (const user of portalUsers) {
      await createNotification({
        workspace: invoice.workspace,
        user: user._id,
        type: 'invoice_overdue',
        title: 'Invoice overdue',
        message: `Invoice ${invoice.number} is overdue.`,
        metadata: { invoiceId: invoice._id.toString() },
        dedupeKey: `invoice-overdue:${invoice._id}`,
        sendEmail: true,
      });
    }
  }

  return {
    deadlineNotificationsChecked: tasks.length,
    invoicesMarkedOverdue,
  };
}
