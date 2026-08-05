import { Router } from 'express';
import { authorize, memberProjectScope, memberTaskScope, workspaceScope } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { Invoice } from '../models/Invoice';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { TimeEntry } from '../models/TimeEntry';
import { asyncHandler } from '../utils/asyncHandler';
import { dashboardSchemas } from '../validation/schemas';

export const dashboardRoutes = Router();

dashboardRoutes.get(
  '/summary',
  authorize('owner', 'manager', 'member'),
  validate({ query: dashboardSchemas.query }),
  asyncHandler(async (req, res) => {
    const now = new Date();
    const weekStart = new Date(now);
    const day = weekStart.getUTCDay();
    weekStart.setUTCDate(weekStart.getUTCDate() - ((day + 6) % 7));
    weekStart.setUTCHours(0, 0, 0, 0);

    const [activeProjects, overdueTasks, hoursResult, invoiceResult] = await Promise.all([
      Project.countDocuments({
        ...memberProjectScope(req),
        status: 'active',
      }),
      Task.countDocuments({
        ...memberTaskScope(req),
        status: { $ne: 'done' },
        dueDate: { $lt: now },
      }),
      TimeEntry.aggregate([
        {
          $match: {
            ...workspaceScope(req),
            user: req.user!._id,
            startAt: { $gte: weekStart },
          },
        },
        { $group: { _id: null, minutes: { $sum: '$durationMinutes' } } },
      ]),
      req.user!.role === 'member'
        ? Promise.resolve([])
        : Invoice.aggregate([
            {
              $match: {
                ...workspaceScope(req),
                status: { $in: ['sent', 'overdue'] },
              },
            },
            { $group: { _id: '$currency', amount: { $sum: '$total' } } },
          ]),
    ]);

    res.json({
      success: true,
      result: {
        activeProjects,
        overdueTasks,
        hoursThisWeek: Math.round(((hoursResult[0]?.minutes ?? 0) / 60) * 10) / 10,
        outstandingInvoices: invoiceResult,
      },
    });
  })
);
