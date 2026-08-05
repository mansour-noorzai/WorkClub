import type { RequestHandler } from 'express';
import { logger } from '../config/logger';
import { AuditLog } from '../models/AuditLog';

const mutationMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const auditMutations: RequestHandler = (req, res, next) => {
  res.on('finish', () => {
    if (
      !mutationMethods.has(req.method) ||
      !req.user ||
      res.statusCode >= 500 ||
      req.path.startsWith('/auth/login') ||
      req.path.startsWith('/auth/refresh')
    ) {
      return;
    }

    const resourceType = req.baseUrl.split('/').filter(Boolean).at(-1) ?? 'unknown';
    const resourceId =
      req.params.id ?? req.params.userId ?? req.params.inviteId ?? undefined;

    void AuditLog.create({
      workspace: req.user.workspace,
      actor: req.user._id,
      action: `${req.method} ${req.baseUrl}${req.route?.path ?? req.path}`,
      resourceType,
      resourceId,
      requestId: String(req.id),
      ip: req.ip,
      userAgent: req.get('user-agent'),
      statusCode: res.statusCode,
    }).catch((error: unknown) => {
      logger.warn({ error, requestId: String(req.id) }, 'Unable to persist audit event');
    });
  });

  next();
};
