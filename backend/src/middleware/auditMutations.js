"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditMutations = void 0;
var logger_1 = require("../config/logger");
var AuditLog_1 = require("../models/AuditLog");
var mutationMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
var auditMutations = function (req, res, next) {
    res.on('finish', function () {
        var _a, _b, _c, _d, _e, _f;
        if (!mutationMethods.has(req.method) ||
            !req.user ||
            res.statusCode >= 500 ||
            req.path.startsWith('/auth/login') ||
            req.path.startsWith('/auth/refresh')) {
            return;
        }
        var resourceType = (_a = req.baseUrl.split('/').filter(Boolean).at(-1)) !== null && _a !== void 0 ? _a : 'unknown';
        var resourceId = (_d = (_c = (_b = req.params.id) !== null && _b !== void 0 ? _b : req.params.userId) !== null && _c !== void 0 ? _c : req.params.inviteId) !== null && _d !== void 0 ? _d : undefined;
        void AuditLog_1.AuditLog.create({
            workspace: req.user.workspace,
            actor: req.user._id,
            action: "".concat(req.method, " ").concat(req.baseUrl).concat((_f = (_e = req.route) === null || _e === void 0 ? void 0 : _e.path) !== null && _f !== void 0 ? _f : req.path),
            resourceType: resourceType,
            resourceId: resourceId,
            requestId: String(req.id),
            ip: req.ip,
            userAgent: req.get('user-agent'),
            statusCode: res.statusCode,
        }).catch(function (error) {
            logger_1.logger.warn({ error: error, requestId: String(req.id) }, 'Unable to persist audit event');
        });
    });
    next();
};
exports.auditMutations = auditMutations;
