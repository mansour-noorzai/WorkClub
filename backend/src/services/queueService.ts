import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { getEnv } from '../config/env';
import { logger } from '../config/logger';

export const notificationQueueName = 'workclub-notifications';

export type NotificationJob =
  | { name: 'deliver-notification-email'; data: { notificationId: string } }
  | { name: 'notification-sweep'; data: Record<string, never> };

let connection: IORedis | undefined;
let queue: Queue | undefined;

export function queueIsEnabled(): boolean {
  const env = getEnv();
  return env.QUEUE_MODE === 'redis' || (env.QUEUE_MODE === 'auto' && Boolean(env.REDIS_URL));
}

export function getQueueConnection(): IORedis {
  const env = getEnv();
  if (!env.REDIS_URL) {
    throw new Error('REDIS_URL is required when the Redis queue is enabled.');
  }
  connection ??= new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });
  return connection;
}

export function getNotificationQueue(): Queue {
  queue ??= new Queue(notificationQueueName, {
    connection: getQueueConnection(),
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2_000 },
      removeOnComplete: 1_000,
      removeOnFail: 5_000,
    },
  });
  return queue;
}

export async function enqueueNotificationEmail(notificationId: string): Promise<void> {
  await getNotificationQueue().add(
    'deliver-notification-email',
    { notificationId },
    { jobId: `notification-email-${notificationId}` }
  );
}

export async function ensureScheduledJobs(): Promise<void> {
  if (!queueIsEnabled()) return;
  await getNotificationQueue().upsertJobScheduler(
    'notification-sweep-hourly',
    { every: 60 * 60 * 1_000 },
    { name: 'notification-sweep', data: {} }
  );
  logger.info('Redis notification scheduler is configured');
}

export async function closeQueueResources(): Promise<void> {
  if (queue) await queue.close();
  if (connection) await connection.quit();
  queue = undefined;
  connection = undefined;
}
