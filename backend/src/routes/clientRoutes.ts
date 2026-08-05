import { Router } from 'express';
import { authorize, workspaceScope } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { Client } from '../models/Client';
import { Project } from '../models/Project';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';
import { pagination } from '../utils/pagination';
import { clientSchemas } from '../validation/schemas';

export const clientRoutes = Router();
clientRoutes.use(authorize('owner', 'manager'));

clientRoutes.get(
  '/',
  validate({ query: clientSchemas.list }),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req.query as never);
    const { search, status } = req.query as { search?: string; status?: string };
    const query: Record<string, unknown> = { ...workspaceScope(req) };
    if (status) query.status = status;
    if (search) query.name = { $regex: escapeRegex(search), $options: 'i' };
    const [items, total] = await Promise.all([
      Client.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Client.countDocuments(query),
    ]);
    res.json({ success: true, result: items, meta: { page, limit, total } });
  })
);

clientRoutes.post(
  '/',
  validate({ body: clientSchemas.create }),
  asyncHandler(async (req, res) => {
    const client = await Client.create({
      ...req.body,
      workspace: req.user!.workspace,
      createdBy: req.user!._id,
    });
    res.status(201).json({ success: true, result: client });
  })
);

clientRoutes.get(
  '/:id',
  validate({ params: clientSchemas.params }),
  asyncHandler(async (req, res) => {
    const client = await Client.findOne({ _id: req.params.id, ...workspaceScope(req) }).lean();
    if (!client) throw new ApiError(404, 'Client not found.');
    res.json({ success: true, result: client });
  })
);

clientRoutes.patch(
  '/:id',
  validate({ params: clientSchemas.params, body: clientSchemas.update }),
  asyncHandler(async (req, res) => {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, ...workspaceScope(req) },
      req.body,
      { new: true, runValidators: true }
    );
    if (!client) throw new ApiError(404, 'Client not found.');
    res.json({ success: true, result: client });
  })
);

clientRoutes.delete(
  '/:id',
  validate({ params: clientSchemas.params }),
  asyncHandler(async (req, res) => {
    if (
      await Project.exists({
        client: req.params.id,
        ...workspaceScope(req),
        status: { $in: ['planned', 'active', 'on_hold'] },
      })
    ) {
      throw new ApiError(409, 'Archive or complete this client’s active projects first.');
    }
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, ...workspaceScope(req) },
      { removed: true, status: 'archived' },
      { new: true }
    );
    if (!client) throw new ApiError(404, 'Client not found.');
    res.json({ success: true, result: client });
  })
);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
