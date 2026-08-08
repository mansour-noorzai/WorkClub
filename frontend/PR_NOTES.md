# Runtime API config and deployment notes

This branch introduces a small runtime configuration mechanism so the built frontend can point to a different backend URL without requiring a rebuild. It is useful when you host the frontend and backend as separate services (for example on Render).

Files added/changed

- `frontend/public/config.json` — runtime config (default now points to the Render backend in this branch)
- `frontend/src/config.ts` — loader that fetches `/config.json` before app boot
- `frontend/src/main.tsx` — updated to `await loadRuntimeConfig()` before mounting
- `frontend/src/api/client.ts` — uses `getApiUrl()` runtime value as the axios base URL

Render deployment instructions

Preferred: generate `public/config.json` at build time from an environment variable so you can update the target backend without changing code.

1. In your Render frontend service, add an Environment Variable:
   - `FRONTEND_API_URL` = `https://workclub-backend.onrender.com/api`

2. Set the **Build Command** for the frontend service to:

```bash
sh -lc 'if [ -n "$FRONTEND_API_URL" ]; then echo "{\"apiUrl\":\"$FRONTEND_API_URL\"}" > public/config.json; fi && npm install && npm run build'
```

This writes `public/config.json` before the build, ensuring the deployed site calls the correct backend.

Alternate: keep `config.json` static in the repo and set the desired URL there (already set in this branch). If you edit `frontend/public/config.json` directly in the repo, be sure to rebuild the frontend and redeploy.

CORS note

If your frontend and backend are on different origins, ensure the backend allows the frontend origin and allows credentials (cookies) if you rely on refresh cookies. Example (Express):

```js
import cors from 'cors';
app.use(
  cors({ origin: 'https://workclub-frontend.onrender.com', credentials: true })
);
```

Open question

- I can open a pull request from `fix/runtime-api-config` into `main` with these changes and this README note. Do you want me to open the PR now?