import { Router } from 'express';
import { authorize, workspaceScope } from '../middleware/authorize';
import { AuditLog } from '../models/AuditLog';
import { asyncHandler } from '../utils/asyncHandler';
import { pagination } from '../utils/pagination';
import { validate } from '../middleware/validate';
import { auditSchemas } from '../validation/schemas';

export const auditRoutes = Router();
auditRoutes.use(authorize('owner'));

auditRoutes.get(
  '/',
  validate({ query: auditSchemas.list }),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req.query as never);
    const query: Record<string, unknown> = workspaceScope(req);
    if (req.query.actor) query.actor = req.query.actor;
    if (req.query.resourceType) query.resourceType = req.query.resourceType;

    const [items, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actor', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.json({ success: true, result: items, meta: { page, limit, total } });
  })
);
