# Contributing to WorkClub

## Development setup

Use Node.js 22 and npm 10 or newer. Copy `backend/.env.example` to `backend/.env`, configure a local MongoDB URI and unique JWT secret, then run:

```bash
npm ci
npm run setup
npm run dev:all
```

## Quality gate

Before submitting a change, run:

```bash
npm run lint
npm test
TEST_MONGO_URI=mongodb://127.0.0.1:27017/workclub-integration npm run test:integration
npm run build
npm audit --omit=dev --audit-level=high
```

Run `npm run seed:demo` before the Playwright suite. Tests must prove authorization and tenant boundaries at the API layer; hiding a frontend control is not sufficient authorization.

## Change discipline

- Keep every operational database query workspace-scoped.
- Validate request bodies, route parameters, and query strings with Zod.
- Add or update tests for bug fixes and permission changes.
- Do not commit secrets, generated builds, dependency folders, or test reports.
- Update `CHANGELOG.md`, the OpenAPI contract, and relevant operational documentation when behavior changes.

By contributing, you agree that your contribution is provided under AGPL-3.0-only.
