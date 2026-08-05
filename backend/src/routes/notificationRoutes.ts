import { Router } from 'express';
import { workspaceScope } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { Notification } from '../models/Notification';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';
import { pagination } from '../utils/pagination';
import { notificationSchemas } from '../validation/schemas';

export const notificationRoutes = Router();

notificationRoutes.get(
  '/',
  validate({ query: notificationSchemas.list }),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req.query as never);
    const query: Record<string, unknown> = {
      ...workspaceScope(req),
      user: req.user!._id,
    };
    if (String(req.query.unreadOnly) === 'true') query.readAt = { $exists: false };
    const [items, total, unread] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({
        ...workspaceScope(req),
        user: req.user!._id,
        readAt: { $exists: false },
      }),
    ]);
    res.json({ success: true, result: items, meta: { page, limit, total, unread } });
  })
);

notificationRoutes.patch(
  '/:id/read',
  validate({ params: notificationSchemas.params }),
  asyncHandler(async (req, res) => {
    const item = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        ...workspaceScope(req),
        user: req.user!._id,
      },
      { readAt: new Date() },
      { new: true }
    );
    if (!item) throw new ApiError(404, 'Notification not found.');
    res.json({ success: true, result: item });
  })
);
