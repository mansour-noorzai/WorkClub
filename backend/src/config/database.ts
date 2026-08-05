import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import mongoose from 'mongoose';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import { getEnv } from './env';

let mongod: MongoMemoryServer | undefined;
let memoryDbPath: string | undefined;

export async function connectDatabase(): Promise<typeof mongoose> {
  const env = getEnv();
  mongoose.set("strictQuery", true);

  let uri = env.MONGO_URI;

  // In-memory MongoDB is opt-in. Test and CI environments can therefore use
  // the real MongoDB URI supplied by their runner.
  if (process.env.USE_IN_MEMORY_MONGO === 'true') {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryDbPath = await mkdtemp(join(process.cwd(), '.workclub-mongodb-'));
    try {
      mongod = await MongoMemoryServer.create({
        binary: { version: process.env.MONGOMS_VERSION ?? '8.0.4' },
        instance: {
          dbPath: memoryDbPath,
          storageEngine: 'wiredTiger',
          args: process.platform === 'win32' ? [] : ['--nounixsocket'],
        },
      });
    } catch (error) {
      await removeMemoryDatabaseFiles();
      throw error;
    }
    uri = mongod.getUri();
  }

  return mongoose.connect(uri, {
    maxPoolSize: env.MONGO_MAX_POOL_SIZE,
    serverSelectionTimeoutMS: env.MONGO_SERVER_SELECTION_TIMEOUT_MS,
    autoIndex: env.NODE_ENV !== "production",
  });
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
  } finally {
    try {
      if (mongod) await mongod.stop();
    } finally {
      mongod = undefined;
      await removeMemoryDatabaseFiles();
    }
  }
}

async function removeMemoryDatabaseFiles(): Promise<void> {
  if (memoryDbPath) {
    const pathToRemove = memoryDbPath;
    memoryDbPath = undefined;
    await rm(pathToRemove, { recursive: true, force: true });
  }
}
