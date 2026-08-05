import type { Types } from 'mongoose';
import { getEnv } from '../config/env';
import { logger } from '../config/logger';
import { Notification, type NotificationType } from '../models/Notification';
import { User } from '../models/User';
import { sendEmail } from './emailService';
import {
  enqueueNotificationEmail,
  queueIsEnabled,
} from './queueService';

interface NotificationInput {
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  dedupeKey?: string;
  sendEmail?: boolean;
}

export async function createNotification(input: NotificationInput) {
  let notification;
  try {
    notification = await Notification.create({
      workspace: input.workspace,
      user: input.user,
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: input.metadata,
      dedupeKey: input.dedupeKey,
      emailStatus: input.sendEmail ? 'not_requested' : 'skipped',
    });
  } catch (error) {
    const duplicate = error as { code?: number };
    if (duplicate.code === 11000 && input.dedupeKey) {
      return Notification.findOne({
        workspace: input.workspace,
        user: input.user,
        dedupeKey: input.dedupeKey,
      });
    }
    throw error;
  }

  if (!input.sendEmail) return notification;

  if (!getEnv().RESEND_API_KEY || !getEnv().EMAIL_FROM) {
    notification.emailStatus = 'skipped';
    await notification.save();
    return notification;
  }

  if (queueIsEnabled()) {
    await enqueueNotificationEmail(notification._id.toString());
  } else {
    await deliverNotificationEmail(notification._id.toString());
  }
  return notification;
}

export async function deliverNotificationEmail(notificationId: string): Promise<void> {
  const notification = await Notification.findById(notificationId);
  if (!notification || notification.emailStatus === 'sent') return;

  const user = await User.findById(notification.user).select('email name');
  if (!user) {
    notification.emailStatus = 'failed';
    await notification.save();
    return;
  }

  const status = await sendEmail({
    to: user.email,
    subject: notification.title,
    heading: notification.title,
    message: notification.message,
    actionLabel: 'Open WorkClub',
    actionUrl: getEnv().APP_URL,
  });
  notification.emailStatus = status;
  await notification.save();

  if (status === 'failed') {
    logger.warn({ notificationId }, 'Notification email delivery failed');
    throw new Error('Notification email delivery failed.');
  }
}
