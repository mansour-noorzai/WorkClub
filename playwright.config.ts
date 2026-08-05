import { defineConfig, devices } from "@playwright/test";

const backendEnvironment = {
  NODE_ENV: "test",
  PORT: "8888",
  MONGO_URI:
    process.env.E2E_MONGO_URI || "mongodb://127.0.0.1:27017/workclub-e2e",
  JWT_SECRET: "e2e-secret-that-is-longer-than-thirty-two-characters",
  JWT_ACCESS_EXPIRES_IN: "15m",
  COOKIE_SECURE: "false",
  REQUIRE_EMAIL_VERIFICATION: "false",
  QUEUE_MODE: "inline",
  LOG_LEVEL: "silent",
  FRONTEND_ORIGIN: "http://127.0.0.1:5173",
  APP_URL: "http://127.0.0.1:5173",
};

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev:all",
    port: 5173,
    timeout: 120_000,
    reuseExistingServer: true,
    env: {
      ...backendEnvironment,
      USE_IN_MEMORY_MONGO: "false",
      VITE_API_URL: "http://127.0.0.1:8888/api",
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
  ],
});
