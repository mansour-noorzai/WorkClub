import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import { getEnv } from './config/env';
import { loadOpenApiDocument } from './config/openapi';
import { metricsRegistry } from './config/metrics';
import { auditMutations } from './middleware/auditMutations';
import { authenticate } from './middleware/authenticate';
import { requestLogger, requestMetrics } from './middleware/requestObservability';
import { auditRoutes } from './routes/auditRoutes';
import { authRoutes } from './routes/authRoutes';
import { clientRoutes } from './routes/clientRoutes';
import { dashboardRoutes } from './routes/dashboardRoutes';
import { invoiceRoutes } from './routes/invoiceRoutes';
import { notificationRoutes } from './routes/notificationRoutes';
import { portalRoutes } from './routes/portalRoutes';
import { projectRoutes } from './routes/projectRoutes';
import { proposalRoutes } from './routes/proposalRoutes';
import { taskRoutes } from './routes/taskRoutes';
import { teamRoutes } from './routes/teamRoutes';
import { timeEntryRoutes } from './routes/timeEntryRoutes';
import { workspaceRoutes } from './routes/workspaceRoutes';
import { ApiError } from './utils/apiError';

export function createApp() {
  const app = express();
  const env = getEnv();
  const openApiDocument = loadOpenApiDocument();

  app.disable('x-powered-by');
  if (env.TRUST_PROXY) app.set('trust proxy', 1);
  app.use(requestLogger);
  app.use(requestMetrics);
  // The API serves Swagger UI with inline bootstrap code. The browser application
  // is protected by the stricter CSP in frontend/nginx.conf.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN.split(',').map((origin) => origin.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      result: { service: 'WorkClub API', status: 'ok', version: '1.1.0' },
    });
  });
  app.get('/api/health/live', (_req, res) => {
    res.json({ success: true, result: { status: 'alive' } });
  });
  app.get('/api/health/ready', (_req, res) => {
    const ready = mongoose.connection.readyState === 1;
    res.status(ready ? 200 : 503).json({
      success: ready,
      result: { status: ready ? 'ready' : 'not_ready', database: ready ? 'up' : 'down' },
    });
  });
  app.get('/api/metrics', async (req, res) => {
    if (
      env.METRICS_TOKEN &&
      req.headers.authorization !== `Bearer ${env.METRICS_TOKEN}`
    ) {
      return res.status(401).json({ success: false, message: 'Metrics authorization required.' });
    }
    res.setHeader('content-type', metricsRegistry.contentType);
    return res.send(await metricsRegistry.metrics());
  });
  app.get('/api/docs.json', (_req, res) => res.json(openApiDocument));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use(
    '/api/auth/login',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true,
    })
  );
  app.use(
    ['/api/auth/register-workspace', '/api/auth/request-password-reset', '/api/auth/resend-verification'],
    rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false })
  );
  app.use(
    '/api/auth',
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false }),
    authRoutes
  );

  app.use('/api', authenticate);
  app.use('/api', auditMutations);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/client', clientRoutes);
  app.use('/api/project', projectRoutes);
  app.use('/api/task', taskRoutes);
  app.use('/api/timeentry', timeEntryRoutes);
  app.use('/api/invoice', invoiceRoutes);
  app.use('/api/proposal', proposalRoutes);
  app.use('/api/team', teamRoutes);
  app.use('/api/workspace', workspaceRoutes);
  app.use('/api/notification', notificationRoutes);
  app.use('/api/portal', portalRoutes);
  app.use('/api/audit', auditRoutes);

  app.use((_req, _res, next) => next(new ApiError(404, 'Route not found.')));

  app.use(
    (
      error: unknown,
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      if (error instanceof ApiError) {
        return res
          .status(error.status)
          .json({ success: false, message: error.message, details: error.details ?? null });
      }
      const possibleMongoError = error as { code?: number; keyValue?: unknown; message?: string };
      if (possibleMongoError.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'A record with this unique value already exists.',
          details: possibleMongoError.keyValue ?? null,
        });
      }
      if (env.NODE_ENV !== 'test') req.log.error({ error }, 'Unhandled request error');
      return res.status(500).json({
        success: false,
        message: env.NODE_ENV === 'production' ? 'Internal server error.' : possibleMongoError.message,
      });
    }
  );

  return app;
}
