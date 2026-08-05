import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { createHash, randomBytes, randomUUID } from 'crypto';
import type { HydratedDocument } from 'mongoose';
import { getEnv } from '../config/env';
import type { IUser } from '../models/User';

export function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  return {
    salt,
    password: bcrypt.hashSync(salt + password),
  };
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  return bcrypt.compareSync(salt + password, hash);
}

export function createOpaqueToken(bytes = 48): string {
  return randomBytes(bytes).toString('base64url');
}

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createRefreshSession(input?: { ip?: string; userAgent?: string }) {
  const env = getEnv();
  const now = new Date();
  const refreshToken = createOpaqueToken();
  return {
    refreshToken,
    session: {
      sessionId: randomUUID(),
      refreshTokenHash: hashOpaqueToken(refreshToken),
      expiresAt: new Date(now.getTime() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
      createdAt: now,
      lastUsedAt: now,
      ip: input?.ip,
      userAgent: input?.userAgent,
    },
  };
}

export function issueAuthToken(
  user: HydratedDocument<IUser>,
  sessionId: string = randomUUID()
): string {
  const env = getEnv();
  return jwt.sign(
    {
      id: user._id.toString(),
      workspace: user.workspace.toString(),
      role: user.role,
      sid: sessionId,
      type: 'access',
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'] }
  );
}

export function verifyAuthToken(token: string): {
  id: string;
  workspace: string;
  role: string;
  sid?: string;
  type?: string;
} {
  const payload = jwt.verify(token, getEnv().JWT_SECRET) as {
    id: string;
    workspace: string;
    role: string;
    sid?: string;
    type?: string;
  };
  if (payload.type && payload.type !== 'access') throw new Error('Invalid token type.');
  return payload;
}
