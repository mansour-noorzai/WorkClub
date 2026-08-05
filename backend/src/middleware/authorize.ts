import type { RequestHandler } from 'express';
import type { UserRole } from '../models/User';
import { ApiError } from '../utils/apiError';

export function authorize(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required.'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission for this action.'));
    }
    return next();
  };
}

export function workspaceScope(req: Express.Request) {
  if (!req.user) throw new ApiError(401, 'Authentication required.');
  return { workspace: req.user.workspace, removed: false };
}

export function memberProjectScope(req: Express.Request) {
  const scope: Record<string, unknown> = workspaceScope(req);
  if (req.user?.role === 'member') scope.teamMembers = req.user._id;
  if (req.user?.role === 'client') scope.client = req.user.client;
  return scope;
}

export function memberTaskScope(req: Express.Request) {
  const scope: Record<string, unknown> = workspaceScope(req);
  if (req.user?.role === 'member') scope.assignee = req.user._id;
  return scope;
}
