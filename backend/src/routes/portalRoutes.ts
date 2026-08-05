import { Router } from 'express';
import { authorize, workspaceScope } from '../middleware/authorize';
import { Invoice } from '../models/Invoice';
import { Project } from '../models/Project';
import { asyncHandler } from '../utils/asyncHandler';

export const portalRoutes = Router();
portalRoutes.use(authorize('client'));

portalRoutes.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const [projects, invoices] = await Promise.all([
      Project.find({
        ...workspaceScope(req),
        client: req.user!.client,
      })
        .select('name code description status deadline budget.currency updatedAt')
        .sort({ updatedAt: -1 })
        .lean(),
      Invoice.find({
        ...workspaceScope(req),
        client: req.user!.client,
        status: { $ne: 'draft' },
      })
        .select('number project issueDate dueDate status currency total paidAt')
        .populate('project', 'name code')
        .sort({ issueDate: -1 })
        .lean(),
    ]);
    res.json({ success: true, result: { projects, invoices } });
  })
);
