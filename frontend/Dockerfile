FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_API_URL=/api
ARG VITE_SOURCE_URL=/LICENSE.txt
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOURCE_URL=$VITE_SOURCE_URL

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci

COPY frontend frontend
RUN npm run build --workspace frontend

FROM nginx:1.29-alpine AS runtime
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
