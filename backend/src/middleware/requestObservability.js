"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestMetrics = exports.requestLogger = void 0;
var crypto_1 = require("crypto");
var pino_http_1 = require("pino-http");
var logger_1 = require("../config/logger");
var metrics_1 = require("../config/metrics");
exports.requestLogger = (0, pino_http_1.default)({
    logger: logger_1.logger,
    genReqId: function (req, res) {
        var _a;
        var requestId = ((_a = req.headers['x-request-id']) === null || _a === void 0 ? void 0 : _a.toString()) || (0, crypto_1.randomUUID)();
        res.setHeader('x-request-id', requestId);
        return requestId;
    },
    customProps: function (req) {
        var _a, _b, _c, _d;
        var request = req;
        return {
            workspaceId: (_b = (_a = request.user) === null || _a === void 0 ? void 0 : _a.workspace) === null || _b === void 0 ? void 0 : _b.toString(),
            userId: (_d = (_c = request.user) === null || _c === void 0 ? void 0 : _c._id) === null || _d === void 0 ? void 0 : _d.toString(),
        };
    },
    customLogLevel: function (_req, res, error) {
        if (error || res.statusCode >= 500)
            return 'error';
        if (res.statusCode >= 400)
            return 'warn';
        return 'info';
    },
});
var requestMetrics = function (req, res, next) {
    var startedAt = process.hrtime.bigint();
    res.on('finish', function () {
        var _a;
        var durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1000000000;
        // Never use the raw URL as a metric label: IDs and attacker-controlled paths
        // would create unbounded Prometheus cardinality.
        var route = ((_a = req.route) === null || _a === void 0 ? void 0 : _a.path) ? String(req.route.path) : 'unmatched';
        var labels = {
            method: req.method,
            route: route,
            status: String(res.statusCode),
        };
        metrics_1.httpRequests.inc(labels);
        metrics_1.httpDuration.observe(labels, durationSeconds);
    });
    next();
};
exports.requestMetrics = requestMetrics;
