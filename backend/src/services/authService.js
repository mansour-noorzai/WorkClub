"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.createOpaqueToken = createOpaqueToken;
exports.hashOpaqueToken = hashOpaqueToken;
exports.createRefreshSession = createRefreshSession;
exports.issueAuthToken = issueAuthToken;
exports.verifyAuthToken = verifyAuthToken;
var bcryptjs_1 = require("bcryptjs");
var jsonwebtoken_1 = require("jsonwebtoken");
var crypto_1 = require("crypto");
var env_1 = require("../config/env");
function hashPassword(password, salt) {
    if (salt === void 0) { salt = (0, crypto_1.randomBytes)(16).toString('hex'); }
    return {
        salt: salt,
        password: bcryptjs_1.default.hashSync(salt + password),
    };
}
function verifyPassword(password, salt, hash) {
    return bcryptjs_1.default.compareSync(salt + password, hash);
}
function createOpaqueToken(bytes) {
    if (bytes === void 0) { bytes = 48; }
    return (0, crypto_1.randomBytes)(bytes).toString('base64url');
}
function hashOpaqueToken(token) {
    return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
}
function createRefreshSession(input) {
    var env = (0, env_1.getEnv)();
    var now = new Date();
    var refreshToken = createOpaqueToken();
    return {
        refreshToken: refreshToken,
        session: {
            sessionId: (0, crypto_1.randomUUID)(),
            refreshTokenHash: hashOpaqueToken(refreshToken),
            expiresAt: new Date(now.getTime() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
            createdAt: now,
            lastUsedAt: now,
            ip: input === null || input === void 0 ? void 0 : input.ip,
            userAgent: input === null || input === void 0 ? void 0 : input.userAgent,
        },
    };
}
function issueAuthToken(user, sessionId) {
    if (sessionId === void 0) { sessionId = (0, crypto_1.randomUUID)(); }
    var env = (0, env_1.getEnv)();
    return jsonwebtoken_1.default.sign({
        id: user._id.toString(),
        workspace: user.workspace.toString(),
        role: user.role,
        sid: sessionId,
        type: 'access',
    }, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN });
}
function verifyAuthToken(token) {
    var payload = jsonwebtoken_1.default.verify(token, (0, env_1.getEnv)().JWT_SECRET);
    if (payload.type && payload.type !== 'access')
        throw new Error('Invalid token type.');
    return payload;
}
