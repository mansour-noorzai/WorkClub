import 'dotenv/config';
import { z } from 'zod';

const booleanFromString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true')
  .default('false');

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(8888),
    MONGO_URI: z.string().min(1),
    MONGO_MAX_POOL_SIZE: z.coerce.number().int().min(5).max(200).default(20),
    MONGO_SERVER_SELECTION_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(1_000)
      .max(60_000)
      .default(10_000),
    JWT_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
    REFRESH_COOKIE_NAME: z.string().min(1).default('workclub_refresh'),
    COOKIE_SECURE: booleanFromString,
    REQUIRE_EMAIL_VERIFICATION: booleanFromString,
    FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
    APP_URL: z.string().default('http://localhost:5173'),
    TRUST_PROXY: booleanFromString,
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    METRICS_TOKEN: z.string().min(16).optional(),
    REDIS_URL: z.string().url().optional(),
    QUEUE_MODE: z.enum(['auto', 'redis', 'inline']).default('auto'),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
  });

export type AppEnv = z.infer<typeof schema>;

let cached: AppEnv | undefined;

export function getEnv(): AppEnv {
  if (!cached) {
    const parsed = schema.parse(process.env);
    cached = parsed;
  }
  return cached;
}

export function resetEnvForTests(): void {
  cached = undefined;
}
