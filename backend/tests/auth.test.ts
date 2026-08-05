import { Types } from 'mongoose';
import { hashPassword, issueAuthToken, verifyAuthToken, verifyPassword } from '../src/services/authService';
import { resetEnvForTests } from '../src/config/env';

describe('authentication service', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/workclub-test';
    process.env.JWT_SECRET = 'test-secret-that-is-longer-than-thirty-two-characters';
    process.env.JWT_ACCESS_EXPIRES_IN = '1h';
    resetEnvForTests();
  });

  it('hashes and verifies passwords with the preserved salt + password flow', () => {
    const credentials = hashPassword('correct-horse-battery-staple');
    expect(verifyPassword('correct-horse-battery-staple', credentials.salt, credentials.password)).toBe(true);
    expect(verifyPassword('wrong-password', credentials.salt, credentials.password)).toBe(false);
  });

  it('issues a signed token containing the user, workspace, and role', () => {
    const user = {
      _id: new Types.ObjectId(),
      workspace: new Types.ObjectId(),
      role: 'manager',
    } as unknown as Parameters<typeof issueAuthToken>[0];
    const payload = verifyAuthToken(issueAuthToken(user));
    expect(payload.id).toBe(user._id.toString());
    expect(payload.workspace).toBe(user.workspace.toString());
    expect(payload.role).toBe('manager');
  });
});
