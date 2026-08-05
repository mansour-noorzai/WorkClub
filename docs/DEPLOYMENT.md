# Deployment and operations

## Container deployment

Copy the Docker environment template:

```bash
cp .env.docker.example .env.docker
```

Set a strong secret, then start the stack:

```bash
docker compose --env-file .env.docker up --build -d
docker compose exec api npm run db:indexes
docker compose exec api npm run seed:demo
```

Open `http://localhost:5173`.

## Production topology

Deploy the frontend, API and worker as separate processes. Route `/api` to the API on the same
public origin as the frontend so cookies and the frontend content-security policy remain strict.
Use managed MongoDB and managed Redis where possible. The API and worker use the same source image
but different commands:

```text
API:    node dist/server.js
Worker: node dist/worker.js
```

Required production variables:

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://...
REDIS_URL=rediss://...
QUEUE_MODE=redis
JWT_SECRET=...
COOKIE_SECURE=true
REQUIRE_EMAIL_VERIFICATION=true
FRONTEND_ORIGIN=https://app.example.com
APP_URL=https://app.example.com
TRUST_PROXY=true
METRICS_TOKEN=...
RESEND_API_KEY=...
EMAIL_FROM=WorkClub <notifications@example.com>
```

Set the frontend build variable `VITE_SOURCE_URL` to the public repository or source-download page
for the deployed version. This is required to provide corresponding source to network users under
the AGPL; the local default links only to the bundled license text.

## Release procedure

1. Use Node.js 22 and run `npm ci`.
2. Run `npm run lint`, unit tests, integration tests and `npm run build`.
3. Build versioned API and frontend images from the reviewed lockfile.
4. Back up MongoDB.
5. Run controlled index synchronization.
6. Deploy the worker, API and frontend.
7. Verify `/api/health/live` and `/api/health/ready`.
8. Check queue failures, API 5xx rate and database connections.
9. Retain the previous images for rollback.

## Backup and restore

Example logical backup:

```bash
mongodump --uri="$MONGO_URI" --archive=workclub.archive --gzip
```

Restore into a separate validation database first:

```bash
mongorestore --uri="$RESTORE_MONGO_URI" --archive=workclub.archive --gzip
```

Never treat an untested backup as recoverable. Schedule regular restore drills.

## Observability

- Structured JSON logs are written to standard output.
- Every response includes `x-request-id`.
- Liveness: `/api/health/live`
- Readiness: `/api/health/ready`
- Prometheus metrics: `/api/metrics`
- API documentation: `/api/docs`

When `METRICS_TOKEN` is configured, supply `Authorization: Bearer <token>`.
