# Changelog

All notable WorkClub changes are documented here.

## 1.1.0 — 2026-08-01

### Security and tenant isolation

- Corrected refresh-session lookup in multi-user databases and made token rotation replay-safe.
- Removed legacy access-token-only session acceptance and legacy credential collection names.
- Enforced workspace and client ownership for proposal-to-project relationships.
- Added targeted authentication throttling and bounded HTTP metric labels.

### Data integrity

- Added controlled invoice and proposal status transitions.
- Prevented duplicate billable-time reservation, future manual time, invalid due dates, unsafe project/team archival, and deletion of tasks with running timers.
- Changed automated integration tests to use the configured MongoDB service by default.

### Product workflows

- Added edit, archive, detail, delete, comment, and status actions across clients, projects, tasks, proposals, invoices, and timesheets.
- Added keyboard focus and responsive table behavior for core screens.

### Delivery

- Added a database-ready Playwright startup sequence, Node.js 22 runtime configuration, stricter frontend security headers, explicit project provenance, and submission documentation.
