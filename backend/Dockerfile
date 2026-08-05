FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci

COPY backend backend
RUN npm run build --workspace backend
RUN npm prune --omit=dev

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S workclub && adduser -S workclub -G workclub

COPY --from=build --chown=workclub:workclub /app/node_modules ./node_modules
COPY --from=build --chown=workclub:workclub /app/backend/dist ./backend/dist
COPY --from=build --chown=workclub:workclub /app/backend/openapi.yaml ./backend/openapi.yaml
COPY --from=build --chown=workclub:workclub /app/backend/package.json ./backend/package.json

WORKDIR /app/backend
USER workclub
EXPOSE 8888
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8888/api/health/ready || exit 1
CMD ["node", "dist/server.js"]
