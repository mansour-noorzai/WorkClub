import type { Server } from 'http';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { getEnv } from './config/env';
import { logger } from './config/logger';
import {
  closeQueueResources,
  ensureScheduledJobs,
  queueIsEnabled,
} from './services/queueService';
import { runNotificationSweep } from './services/notificationSweep';

async function start() {
  const env = getEnv();
  await connectDatabase();
  const app = createApp();
  const server: Server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'WorkClub API is ready');
  });
  let inlineTimer: NodeJS.Timeout | undefined;

  if (queueIsEnabled()) {
    await ensureScheduledJobs();
  } else {
    const hour = 60 * 60 * 1000;
    setTimeout(() => void runNotificationSweep().catch((error) => logger.error({ error })), 5_000);
    inlineTimer = setInterval(
      () => void runNotificationSweep().catch((error) => logger.error({ error })),
      hour
    );
    inlineTimer.unref();
    logger.warn('Redis is not configured; notification jobs are running inline');
  }

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Graceful shutdown started');
    if (inlineTimer) clearInterval(inlineTimer);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await closeQueueResources();
    await disconnectDatabase();
    logger.info('Graceful shutdown complete');
  };

  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));
}

void start().catch((error) => {
  logger.fatal({ error }, 'WorkClub failed to start');
  process.exitCode = 1;
});
