import { Router } from 'express';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { Workspace } from '../models/Workspace';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';
import { workspaceSchemas } from '../validation/schemas';

export const workspaceRoutes = Router();
workspaceRoutes.use(authorize('owner', 'manager', 'member'));

workspaceRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const workspace = await Workspace.findOne({
      _id: req.user!.workspace,
      removed: false,
    }).lean();
    if (!workspace) throw new ApiError(404, 'Workspace not found.');
    if (req.user!.role === 'member' && workspace) {
      workspace.settings.defaultHourlyRate = 0;
      workspace.settings.invoicePrefix = '';
    }
    res.json({ success: true, result: workspace });
  })
);

workspaceRoutes.patch(
  '/',
  authorize('owner', 'manager'),
  validate({ body: workspaceSchemas.update }),
  asyncHandler(async (req, res) => {
    if (req.user!.role === 'manager') {
      const billingKeys = ['currency', 'defaultHourlyRate', 'invoicePrefix'];
      if (
        req.body.settings &&
        billingKeys.some((key) => Object.prototype.hasOwnProperty.call(req.body.settings, key))
      ) {
        throw new ApiError(403, 'Only Owners can update billing settings.');
      }
    }
    const update: Record<string, unknown> = {};
    if (req.body.name) update.name = req.body.name;
    for (const [key, value] of Object.entries(req.body.settings ?? {})) {
      update[`settings.${key}`] = value;
    }
    const workspace = await Workspace.findOneAndUpdate(
      { _id: req.user!.workspace, removed: false },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!workspace) throw new ApiError(404, 'Workspace not found.');
    res.json({ success: true, result: workspace });
  })
);
