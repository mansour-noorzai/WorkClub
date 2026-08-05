import { Worker } from 'bullmq';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './config/logger';
import {
  closeQueueResources,
  ensureScheduledJobs,
  getQueueConnection,
  notificationQueueName,
} from './services/queueService';
import { deliverNotificationEmail } from './services/notificationService';
import { runNotificationSweep } from './services/notificationSweep';

async function startWorker() {
  await connectDatabase();
  await ensureScheduledJobs();

  const worker = new Worker(
    notificationQueueName,
    async (job) => {
      if (job.name === 'deliver-notification-email') {
        await deliverNotificationEmail(String(job.data.notificationId));
        return;
      }
      if (job.name === 'notification-sweep') {
        await runNotificationSweep();
        return;
      }
      throw new Error(`Unsupported notification job: ${job.name}`);
    },
    {
      connection: getQueueConnection(),
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id, jobName: job.name }, 'Background job completed');
  });
  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, jobName: job?.name, error }, 'Background job failed');
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Stopping background worker');
    await worker.close();
    await closeQueueResources();
    await disconnectDatabase();
    process.exit(0);
  };
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));

  logger.info('WorkClub background worker is ready');
}

void startWorker().catch((error) => {
  logger.fatal({ error }, 'WorkClub worker failed to start');
  process.exitCode = 1;
});
