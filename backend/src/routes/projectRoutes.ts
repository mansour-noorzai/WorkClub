import { Router } from 'express';
import { authorize, memberProjectScope, workspaceScope } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { Client } from '../models/Client';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { TimeEntry } from '../models/TimeEntry';
import { User } from '../models/User';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';
import { pagination } from '../utils/pagination';
import { projectSchemas } from '../validation/schemas';

export const projectRoutes = Router();

projectRoutes.get(
  '/',
  authorize('owner', 'manager', 'member'),
  validate({ query: projectSchemas.list }),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req.query as never);
    const { search, status, client } = req.query as Record<string, string | undefined>;
    const query: Record<string, unknown> = memberProjectScope(req);
    if (status) query.status = status;
    if (client) query.client = client;
    if (search) query.name = { $regex: escapeRegex(search), $options: 'i' };
    const [items, total] = await Promise.all([
      Project.find(query)
        .populate('client', 'name status primaryContact')
        .populate('teamMembers', 'name email photo role')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(query),
    ]);
    res.json({ success: true, result: items, meta: { page, limit, total } });
  })
);

projectRoutes.post(
  '/',
  authorize('owner', 'manager'),
  validate({ body: projectSchemas.create }),
  asyncHandler(async (req, res) => {
    const teamMembers = Array.from(
      new Set([...req.body.teamMembers, req.user!._id.toString()])
    );
    await validateRelations(req.user!.workspace, req.body.client, teamMembers);
    const project = await Project.create({
      ...req.body,
      teamMembers,
      workspace: req.user!.workspace,
      createdBy: req.user!._id,
    });
    res.status(201).json({ success: true, result: project });
  })
);

projectRoutes.get(
  '/:id',
  authorize('owner', 'manager', 'member'),
  validate({ params: projectSchemas.params }),
  asyncHandler(async (req, res) => {
    const project = await Project.findOne({ _id: req.params.id, ...memberProjectScope(req) })
      .populate('client', 'name primaryContact status')
      .populate('teamMembers', 'name email photo role')
      .lean();
    if (!project) throw new ApiError(404, 'Project not found.');
    res.json({ success: true, result: project });
  })
);

projectRoutes.patch(
  '/:id',
  authorize('owner', 'manager'),
  validate({ params: projectSchemas.params, body: projectSchemas.update }),
  asyncHandler(async (req, res) => {
    if (req.body.client || req.body.teamMembers) {
      const existing = await Project.findOne({ _id: req.params.id, ...workspaceScope(req) });
      if (!existing) throw new ApiError(404, 'Project not found.');
      if (
        req.body.teamMembers &&
        await Task.exists({
          project: existing._id,
          workspace: req.user!.workspace,
          removed: false,
          status: { $ne: 'done' },
          assignee: { $nin: req.body.teamMembers },
        })
      ) {
        throw new ApiError(409, 'Reassign or complete open tasks before removing project members.');
      }
      await validateRelations(
        req.user!.workspace,
        req.body.client ?? existing.client.toString(),
        req.body.teamMembers ?? existing.teamMembers.map(String)
      );
    }
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, ...workspaceScope(req) },
      req.body,
      { new: true, runValidators: true }
    );
    if (!project) throw new ApiError(404, 'Project not found.');
    res.json({ success: true, result: project });
  })
);

projectRoutes.delete(
  '/:id',
  authorize('owner', 'manager'),
  validate({ params: projectSchemas.params }),
  asyncHandler(async (req, res) => {
    if (
      await TimeEntry.exists({
        project: req.params.id,
        ...workspaceScope(req),
        running: true,
      })
    ) {
      throw new ApiError(409, 'Stop all running timers before archiving this project.');
    }
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, ...workspaceScope(req) },
      { removed: true, status: 'cancelled' },
      { new: true }
    );
    if (!project) throw new ApiError(404, 'Project not found.');
    await Task.updateMany(
      { project: project._id, workspace: req.user!.workspace, removed: false },
      { $set: { removed: true } }
    );
    res.json({ success: true, result: project });
  })
);

async function validateRelations(workspace: unknown, clientId: string, teamMemberIds: string[]) {
  const [client, teamCount] = await Promise.all([
    Client.exists({ _id: clientId, workspace, removed: false }),
    User.countDocuments({
      _id: { $in: teamMemberIds },
      workspace,
      role: { $in: ['owner', 'manager', 'member'] },
      removed: false,
      enabled: true,
    }),
  ]);
  if (!client) throw new ApiError(422, 'Client does not belong to this workspace.');
  if (teamCount !== teamMemberIds.length) {
    throw new ApiError(422, 'One or more team members do not belong to this workspace.');
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
