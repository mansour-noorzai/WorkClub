import { createApp } from "../backend/src/app";
import { connectDatabase } from "../backend/src/config/database";
import type { IncomingMessage, ServerResponse } from "http";

let app = createApp();
let dbReady: Promise<void> | null = null;

async function ensureDatabase(): Promise<void> {
  if (!dbReady) {
    dbReady = connectDatabase().then(() => undefined);
  }
  return dbReady;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  await ensureDatabase();
  return app(req as any, res as any);
}
