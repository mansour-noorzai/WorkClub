# Vercel deployment guide

## What changed

- Added a Vercel config at [vercel.json](vercel.json) for API routing and frontend output.
- Updated the frontend API client to use a relative `/api` base URL so it works on Vercel.
- Added a production environment template at [.env.production.example](.env.production.example).

## Required services

Deploying this app on Vercel requires:

- A MongoDB Atlas or equivalent MongoDB connection string.
- Optional Redis for background jobs if you want full queue behavior.
- Optional Resend API key if you want real email delivery.

## Environment variables to set in Vercel

Add these in the Vercel project settings under Environment Variables:

- `MONGO_URI`
- `JWT_SECRET`
- `FRONTEND_ORIGIN`
- `APP_URL`
- `COOKIE_SECURE=true`
- `TRUST_PROXY=true`
- `NODE_ENV=production`
- `QUEUE_MODE=auto`
- `REDIS_URL` (optional)
- `RESEND_API_KEY` (optional)
- `EMAIL_FROM` (optional)

## Deploy steps

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Set the root directory to the repository root.
4. Add the required environment variables.
5. Deploy.

## Notes

- The Vercel deployment uses the serverless API entrypoint in [api/index.ts](api/index.ts).
- The frontend build output is served from [frontend/dist](frontend/dist).
- The app still depends on a managed database; Vercel alone does not provide MongoDB.
