import { randomUUID } from 'crypto';
import type { RequestHandler } from 'express';
import pinoHttp from 'pino-http';
import { logger } from '../config/logger';
import { httpDuration, httpRequests } from '../config/metrics';

export const requestLogger = pinoHttp({
  logger,
  genReqId(req, res) {
    const requestId = req.headers['x-request-id']?.toString() || randomUUID();
    res.setHeader('x-request-id', requestId);
    return requestId;
  },
  customProps(req) {
    const request = req as unknown as Express.Request;
    return {
      workspaceId: request.user?.workspace?.toString(),
      userId: request.user?._id?.toString(),
    };
  },
  customLogLevel(_req, res, error) {
    if (error || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});

export const requestMetrics: RequestHandler = (req, res, next) => {
  const startedAt = process.hrtime.bigint();
  res.on('finish', () => {
    const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;
    // Never use the raw URL as a metric label: IDs and attacker-controlled paths
    // would create unbounded Prometheus cardinality.
    const route = req.route?.path ? String(req.route.path) : 'unmatched';
    const labels = {
      method: req.method,
      route,
      status: String(res.statusCode),
    };
    httpRequests.inc(labels);
    httpDuration.observe(labels, durationSeconds);
  });
  next();
};
