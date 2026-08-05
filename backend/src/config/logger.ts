import pino from 'pino';
import { getEnv } from './env';

export const logger = pino({
  level: getEnv().LOG_LEVEL,
  base: {
    service: 'workclub-api',
    environment: getEnv().NODE_ENV,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'refreshToken',
      '*.password',
      '*.token',
      '*.refreshToken',
    ],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
