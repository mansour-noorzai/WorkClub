# WorkClub portfolio case study

## Product

WorkClub is a multi-tenant client-work platform for agencies and freelance teams. It combines
client records, project delivery, Kanban tasks, time tracking, proposals, invoices, team access and
a restricted client portal.

## Engineering problem

Agency tools often separate delivery and billing. The difficult part is not CRUD; it is preserving
tenant isolation and permissions while turning collaborative work into reliable billable records.

## Key decisions

- Modular monolith instead of premature microservices
- Workspace identifier included in every protected operational query
- Four explicit roles with server-side access rules
- HttpOnly rotating refresh sessions instead of persistent browser bearer tokens
- Atomic time-entry reservation before invoice creation
- Redis/BullMQ worker for retries and scheduler coordination
- Idempotency keys for recurring notifications
- Structured logs, metrics, health probes and lockfile-based container builds
- Real database integration tests plus browser tests for each user boundary

## Evidence

- `backend/tests/workclub.integration.test.ts` proves token rotation, tenant separation, Member
  assignment scope and concurrent invoice protection against MongoDB.
- `e2e/workclub.spec.ts` proves Owner, Member and Client user journeys.
- `.github/workflows/ci.yml` makes the verification repeatable.
- `backend/openapi.yaml` defines the public API contract.
- `docs/ARCHITECTURE.md` records runtime and trust boundaries.

## Trade-offs

WorkClub remains a modular monolith because its current scale does not justify distributed
transactions or additional network boundaries. Redis is used only where coordination and retry
semantics provide clear value. MongoDB remains the source of truth.

## Responsible portfolio description

WorkClub is derived from an AGPL-licensed upstream project and was substantially reworked into a
different domain and architecture. A portfolio presentation must retain the license and required
provenance notice and should focus on the concrete design and implementation work demonstrated here.

## Suggested interview demonstration

1. Sign in as Owner and show workspace-wide visibility.
2. Sign in as Member and demonstrate assignment scoping.
3. Sign in as Client and show that internal tasks/comments are absent.
4. Run the concurrent invoicing integration test.
5. Show CI, API documentation, logs, metrics and the audit trail.
6. Explain the modular-monolith and queue trade-offs.
