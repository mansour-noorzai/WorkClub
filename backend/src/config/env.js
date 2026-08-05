"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnv = getEnv;
exports.resetEnvForTests = resetEnvForTests;
require("dotenv/config");
var zod_1 = require("zod");
var booleanFromString = zod_1.z
    .enum(['true', 'false'])
    .transform(function (value) { return value === 'true'; })
    .default('false');
var schema = zod_1.z
    .object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.coerce.number().int().positive().default(8888),
    MONGO_URI: zod_1.z.string().min(1),
    MONGO_MAX_POOL_SIZE: zod_1.z.coerce.number().int().min(5).max(200).default(20),
    MONGO_SERVER_SELECTION_TIMEOUT_MS: zod_1.z.coerce
        .number()
        .int()
        .min(1000)
        .max(60000)
        .default(10000),
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_ACCESS_EXPIRES_IN: zod_1.z.string().default('15m'),
    REFRESH_TOKEN_TTL_DAYS: zod_1.z.coerce.number().int().min(1).max(90).default(30),
    REFRESH_COOKIE_NAME: zod_1.z.string().min(1).default('workclub_refresh'),
    COOKIE_SECURE: booleanFromString,
    REQUIRE_EMAIL_VERIFICATION: booleanFromString,
    FRONTEND_ORIGIN: zod_1.z.string().default('http://localhost:5173'),
    APP_URL: zod_1.z.string().default('http://localhost:5173'),
    TRUST_PROXY: booleanFromString,
    LOG_LEVEL: zod_1.z
        .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
        .default('info'),
    METRICS_TOKEN: zod_1.z.string().min(16).optional(),
    REDIS_URL: zod_1.z.string().url().optional(),
    QUEUE_MODE: zod_1.z.enum(['auto', 'redis', 'inline']).default('auto'),
    RESEND_API_KEY: zod_1.z.string().optional(),
    EMAIL_FROM: zod_1.z.string().optional(),
});
var cached;
function getEnv() {
    if (!cached) {
        var parsed = schema.parse(process.env);
        cached = parsed;
    }
    return cached;
}
function resetEnvForTests() {
    cached = undefined;
}
