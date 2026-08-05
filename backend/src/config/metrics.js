"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsRegistry = exports.httpDuration = exports.httpRequests = void 0;
var prom_client_1 = require("prom-client");
Object.defineProperty(exports, "metricsRegistry", { enumerable: true, get: function () { return prom_client_1.register; } });
(0, prom_client_1.collectDefaultMetrics)({ prefix: 'workclub_' });
exports.httpRequests = new prom_client_1.Counter({
    name: 'workclub_http_requests_total',
    help: 'Total HTTP requests handled by the API.',
    labelNames: ['method', 'route', 'status'],
});
exports.httpDuration = new prom_client_1.Histogram({
    name: 'workclub_http_request_duration_seconds',
    help: 'HTTP request duration in seconds.',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});
