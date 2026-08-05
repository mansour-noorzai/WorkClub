import type { RequestHandler } from 'express';
import { User } from '../models/User';
import { UserCredential } from '../models/UserCredential';
import { verifyAuthToken } from '../services/authService';
import { ApiError } from '../utils/apiError';

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : undefined;
    if (!token) throw new ApiError(401, 'Authentication required.');

    const payload = verifyAuthToken(token);
    const [user, credentials] = await Promise.all([
      User.findOne({ _id: payload.id, removed: false, enabled: true }),
      UserCredential.findOne({ user: payload.id, removed: false }),
    ]);

    const activeSession = payload.sid
      ? credentials?.sessions.some(
          (session) =>
            session.sessionId === payload.sid && session.expiresAt.getTime() > Date.now()
        )
      : false;
    if (!user || !credentials || !activeSession) {
      throw new ApiError(401, 'Session is invalid or expired.');
    }

    if (user.workspace.toString() !== payload.workspace) {
      throw new ApiError(401, 'Session workspace is invalid.');
    }

    req.user = user;
    req.authToken = token;
    req.sessionId = payload.sid;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (!user.lastSeenAt || user.lastSeenAt < fiveMinutesAgo) {
      void User.updateOne(
        { _id: user._id, $or: [{ lastSeenAt: { $lt: fiveMinutesAgo } }, { lastSeenAt: null }] },
        { $set: { lastSeenAt: new Date() } }
      ).catch(() => undefined);
    }
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, 'Session is invalid or expired.'));
  }
};
