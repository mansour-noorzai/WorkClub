"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
var pino_1 = require("pino");
var env_1 = require("./env");
exports.logger = (0, pino_1.default)({
    level: (0, env_1.getEnv)().LOG_LEVEL,
    base: {
        service: 'workclub-api',
        environment: (0, env_1.getEnv)().NODE_ENV,
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
    timestamp: pino_1.default.stdTimeFunctions.isoTime,
});
