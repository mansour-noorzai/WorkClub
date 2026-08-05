import { Router } from 'express';
import { authorize, workspaceScope } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { Client } from '../models/Client';
import { Project } from '../models/Project';
import { Proposal } from '../models/Proposal';
import { calculateInvoice, type DraftLine } from '../services/invoiceService';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';
import { pagination } from '../utils/pagination';
import { proposalSchemas } from '../validation/schemas';

export const proposalRoutes = Router();
proposalRoutes.use(authorize('owner', 'manager'));

proposalRoutes.get(
  '/',
  validate({ query: proposalSchemas.list }),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req.query as never);
    const { search, status } = req.query as Record<string, string | undefined>;
    const query: Record<string, unknown> = workspaceScope(req);
    if (status) query.status = status;
    if (search) query.title = { $regex: escapeRegex(search), $options: 'i' };
    const [items, total] = await Promise.all([
      Proposal.find(query)
        .populate('client', 'name primaryContact')
        .populate('project', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Proposal.countDocuments(query),
    ]);
    res.json({ success: true, result: items, meta: { page, limit, total } });
  })
);

proposalRoutes.post(
  '/',
  validate({ body: proposalSchemas.create }),
  asyncHandler(async (req, res) => {
    if (!(await Client.exists({ _id: req.body.client, ...workspaceScope(req) }))) {
      throw new ApiError(422, 'Client does not belong to this workspace.');
    }
    if (req.body.project) {
      const project = await Project.exists({
        _id: req.body.project,
        client: req.body.client,
        ...workspaceScope(req),
      });
      if (!project) {
        throw new ApiError(422, 'Project must belong to the selected client and workspace.');
      }
    }
    const calculated = calculateInvoice(req.body.items as DraftLine[]);
    const proposal = await Proposal.create({
      ...req.body,
      items: calculated.items,
      total: calculated.subTotal,
      workspace: req.user!.workspace,
      createdBy: req.user!._id,
    });
    res.status(201).json({ success: true, result: proposal });
  })
);

proposalRoutes.get(
  '/:id',
  validate({ params: proposalSchemas.params }),
  asyncHandler(async (req, res) => {
    const proposal = await Proposal.findOne({ _id: req.params.id, ...workspaceScope(req) })
      .populate('client', 'name primaryContact')
      .populate('project', 'name code')
      .lean();
    if (!proposal) throw new ApiError(404, 'Proposal not found.');
    res.json({ success: true, result: proposal });
  })
);

proposalRoutes.patch(
  '/:id',
  validate({ params: proposalSchemas.params, body: proposalSchemas.update }),
  asyncHandler(async (req, res) => {
    const previous = await Proposal.findOne({ _id: req.params.id, ...workspaceScope(req) });
    if (!previous) throw new ApiError(404, 'Proposal not found.');
    if (req.body.status && req.body.status !== previous.status) {
      assertProposalTransition(previous.status, req.body.status);
    }
    const proposal = await Proposal.findOneAndUpdate(
      { _id: previous._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!proposal) throw new ApiError(404, 'Proposal not found.');
    res.json({ success: true, result: proposal });
  })
);

proposalRoutes.delete(
  '/:id',
  validate({ params: proposalSchemas.params }),
  asyncHandler(async (req, res) => {
    const proposal = await Proposal.findOneAndUpdate(
      {
        _id: req.params.id,
        ...workspaceScope(req),
        status: { $in: ['draft', 'declined', 'expired'] },
      },
      { removed: true },
      { new: true }
    );
    if (!proposal) throw new ApiError(409, 'Only draft, declined, or expired proposals can be deleted.');
    res.json({ success: true, result: proposal });
  })
);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type ProposalStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';

function assertProposalTransition(current: ProposalStatus, next: ProposalStatus) {
  const allowed: Record<ProposalStatus, ProposalStatus[]> = {
    draft: ['sent'],
    sent: ['accepted', 'declined', 'expired'],
    accepted: [],
    declined: [],
    expired: [],
  };
  if (!allowed[current].includes(next)) {
    throw new ApiError(409, `Proposal status cannot change from ${current} to ${next}.`);
  }
}
