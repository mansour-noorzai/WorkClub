import { collectDefaultMetrics, Counter, Histogram, register } from 'prom-client';

collectDefaultMetrics({ prefix: 'workclub_' });

export const httpRequests = new Counter({
  name: 'workclub_http_requests_total',
  help: 'Total HTTP requests handled by the API.',
  labelNames: ['method', 'route', 'status'] as const,
});

export const httpDuration = new Histogram({
  name: 'workclub_http_request_duration_seconds',
  help: 'HTTP request duration in seconds.',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

export { register as metricsRegistry };
