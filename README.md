# WorkClub

WorkClub is a multi-tenant client-work and team-delivery platform for agencies and freelance teams.
It connects clients, projects, Kanban tasks, time, proposals, invoices and client-facing progress in
one workspace.

## Capabilities

- Isolated tenant workspaces
- Owner, Manager, Member and Client roles
- Client lifecycle and primary-contact management
- Project teams, deadlines, budgets and delivery status
- Project Kanban boards with drag-and-drop tasks
- Task assignment, priority, due date and internal comments
- Start/stop timers, manual entries and weekly timesheets
- Concurrency-safe conversion of billable time into invoice lines
- Project proposals and invoices
- Team and client-portal invitations
- Restricted client portal
- In-app and queued email notifications
- Dashboard delivery and billing metrics
- Active-session management and global logout
- Owner-only audit trail
- OpenAPI documentation, health checks and Prometheus metrics

## Role enforcement

| Role    | Server-enforced access                                                 |
| ------- | ---------------------------------------------------------------------- |
| Owner   | Full operational, team, billing, session and audit access              |
| Manager | Workspace operations; no billing-default changes or Owner controls     |
| Member  | Projects where they are on the team, assigned tasks and their own time |
| Client  | Portal project status and non-draft invoices only                      |

Workspace and assignment restrictions are applied in database queries. Frontend navigation is not
treated as authorization.

## Stack

- Node.js 22+, Express, TypeScript
- MongoDB and Mongoose
- React 18, Redux Toolkit, Ant Design and Vite
- Zod validation
- JWT access tokens and rotating HttpOnly refresh sessions
- Redis and BullMQ
- Pino structured logging and Prometheus metrics
- Jest, Supertest and Playwright
- Docker Compose, Nginx and GitHub Actions

## Architecture

WorkClub is a modular monolith with a separate asynchronous worker. Read:

- [Architecture](docs/ARCHITECTURE.md)
- [Security model](docs/SECURITY.md)
- [Deployment and operations](docs/DEPLOYMENT.md)
- [Portfolio case study](docs/PORTFOLIO_CASE_STUDY.md)
- [OpenAPI contract](backend/openapi.yaml)

Interactive API documentation is available at `http://localhost:8888/api/docs` while the backend is
running.

## Local development

### Requirements

- Node.js 22 or newer
- npm 10 or newer
- MongoDB 6 or newer
- Redis is optional locally and required for production queue mode

Install the exact reviewed dependency set:

```bash
npm ci
```

Create the backend environment file:

```powershell
Copy-Item backend/.env.example backend/.env
```

macOS/Linux:

```bash
cp backend/.env.example backend/.env
```

At minimum, set:

```env
MONGO_URI=mongodb://127.0.0.1:27017/workclub
JWT_SECRET=replace-with-a-unique-random-secret-at-least-32-characters
FRONTEND_ORIGIN=http://localhost:5173
APP_URL=http://localhost:5173
COOKIE_SECURE=false
REQUIRE_EMAIL_VERIFICATION=false
QUEUE_MODE=inline
```

Create the initial workspace and Owner:

```bash
npm run setup
```

Start both applications:

```bash
npm run dev:all
```

Or use separate terminals:

```bash
npm run dev
npm run dev:client
```

Open `http://localhost:5173`.

## Demo workspace

Create a realistic workspace with Owner, Manager, Member and Client accounts:

```bash
npm run seed:demo
```

All demo accounts use `WorkClubDemo!2026`:

| Role    | Email                   |
| ------- | ----------------------- |
| Owner   | `owner@workclub.demo`   |
| Manager | `manager@workclub.demo` |
| Member  | `member@workclub.demo`  |
| Client  | `client@workclub.demo`  |

Rebuild only the known demo tenant:

```bash
npm run seed:demo --workspace backend -- --reset
```

Never use demo credentials in production.

## Docker

```bash
cp .env.docker.example .env.docker
docker compose --env-file .env.docker up --build -d
docker compose exec api npm run db:indexes
docker compose exec api npm run seed:demo
```

The container stack includes frontend, API, worker, MongoDB and Redis. Open
`http://localhost:5173`.

## Authentication

- Access tokens are short-lived and kept in frontend memory.
- Refresh tokens use `HttpOnly`, `SameSite=Lax` cookies.
- Only refresh-token hashes are stored.
- Every refresh rotates the token atomically.
- Sessions can be reviewed and revoked.
- Password reset revokes all existing sessions.
- Verification and reset tokens are random, time-limited and stored only as hashes.

For production:

```env
COOKIE_SECURE=true
REQUIRE_EMAIL_VERIFICATION=true
QUEUE_MODE=redis
REDIS_URL=rediss://...
```

## Email and background jobs

To send real invitations and password-reset emails, configure Resend in the backend environment:

```env
RESEND_API_KEY=re_...
EMAIL_FROM=WorkClub <notifications@your-verified-domain.com>
```

Use an email address from a domain you have verified in Resend. With Redis configured, start the worker:

```bash
npm run worker
```

The worker handles retryable notification emails and the recurring task-deadline/invoice-overdue
sweep. Inline mode is a local-development fallback only.

## Verification commands

```bash
npm run lint
npm test
npm run test:integration
npm run test:coverage --workspace backend
npm run build
npm run test:e2e
npm audit --omit=dev --audit-level=high
```

Integration tests require:

```env
TEST_MONGO_URI=mongodb://127.0.0.1:27017/workclub-integration
```

For an isolated local run, opt into the in-memory test database instead:

```bash
USE_IN_MEMORY_MONGO=true npm run test:integration
```

E2E tests require MongoDB and a seeded demo workspace:

```bash
npm run seed:demo
npm run test:e2e
```

GitHub Actions performs linting, unit tests, a combined real-MongoDB coverage gate, builds,
dependency auditing and Chromium E2E tests on every pull request.

## Operations

| Endpoint            | Purpose                           |
| ------------------- | --------------------------------- |
| `/api/health/live`  | Process liveness                  |
| `/api/health/ready` | MongoDB readiness                 |
| `/api/metrics`      | Prometheus-compatible metrics     |
| `/api/docs`         | Interactive OpenAPI documentation |
| `/api/docs.json`    | Machine-readable API contract     |

Set `METRICS_TOKEN` to protect metrics with a Bearer token.

Production disables automatic MongoDB index creation. Synchronize indexes during a controlled
release:

```bash
npm run db:indexes --workspace backend
```

## Main API groups

```text
/api/auth
/api/dashboard
/api/client
/api/project
/api/task
/api/timeentry
/api/invoice
/api/proposal
/api/team
/api/workspace
/api/notification
/api/portal
/api/audit
```

All request bodies, parameters and query strings are validated with Zod.

## Project provenance and licensing

WorkClub is distributed under GNU AGPL-3.0-only. See [LICENSE](LICENSE) and [NOTICE](NOTICE). If you
operate a modified version over a network, provide users with the corresponding source as required
by the license.

This release contains substantial changes to the product domain, data model, tenant boundaries,
authentication/session model, role enforcement, delivery and billing workflows, interface, tests,
deployment configuration, and documentation. Required upstream provenance is retained only in
[NOTICE](NOTICE). Do not represent the project as an entirely greenfield codebase. Before deploying publicly, set
`VITE_SOURCE_URL` to the public corresponding-source repository or download page for that exact
deployed version.

## Professional handoff checklist

Before a company review or production deployment:

1. Run every command in [Verification commands](#verification-commands) in a clean checkout.
2. Configure production secrets outside the repository and enable HTTPS-only refresh cookies.
3. Publish the corresponding AGPL source and set `VITE_SOURCE_URL` to it.
4. Replace demo data with a fresh workspace and never reuse demo credentials.
5. Configure verified email delivery, MongoDB backups, Redis persistence, metrics protection, and private vulnerability reporting.
6. Record the deployed image identifiers and complete a restore test before launch.

See [CHANGELOG.md](CHANGELOG.md) for the reviewed release changes and [CONTRIBUTING.md](CONTRIBUTING.md) for the engineering quality gate.
