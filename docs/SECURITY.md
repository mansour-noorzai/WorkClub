# Security model

## Implemented controls

- Short-lived signed access tokens
- Hashed, rotating refresh sessions in HttpOnly cookies
- Session listing, individual revocation and global logout
- Bcrypt password hashing with per-user salt
- Strong-password validation for new credentials
- Time-limited email verification and password-reset tokens stored only as hashes
- Generic password-reset responses to reduce account enumeration
- Workspace filters and role checks on protected data
- Zod validation for bodies, parameters and query strings
- Helmet security headers, CORS allow-list and authentication rate limiting
- Request identifiers, structured redacted logs and Owner-visible audit history
- One active timer per user enforced with a partial unique index
- Invoice time-entry reservation to prevent double billing
- Notification deduplication and idempotent queue jobs
- Secrets excluded from repository and container images

## Production requirements

- Set `COOKIE_SECURE=true` and terminate only over HTTPS.
- Use a unique 32+ character `JWT_SECRET` from a secret manager.
- Set `REQUIRE_EMAIL_VERIFICATION=true`.
- Restrict `FRONTEND_ORIGIN` to exact deployed origins.
- Set a protected `METRICS_TOKEN`.
- Use an authenticated Redis service and least-privilege MongoDB database user.
- Configure automated encrypted backups and test restoration.
- Send logs to a protected central sink and alert on repeated 401/403/5xx responses.
- Run dependency and container-image scanning in the deployment environment.

## Reporting

Do not include secrets, personal data or exploit details in public issues. For a review or
submission build, report vulnerabilities through the same private channel used to receive the
project. Before a public launch, enable the repository provider’s private vulnerability-reporting
feature and publish that process here.

## Limitations

WorkClub does not currently implement SSO/SAML, WebAuthn or two-factor authentication. These are
recommended before serving organizations with regulated or high-risk data.
