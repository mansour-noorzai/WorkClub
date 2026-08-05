import { connectDatabase, disconnectDatabase } from '../config/database';
import { logger } from '../config/logger';
import '../models/AuditLog';
import '../models/Client';
import '../models/Invite';
import '../models/Invoice';
import '../models/Notification';
import '../models/Project';
import '../models/Proposal';
import '../models/Task';
import '../models/TimeEntry';
import '../models/User';
import '../models/UserCredential';
import '../models/Workspace';
import mongoose from 'mongoose';

async function main() {
  await connectDatabase();
  const results = await Promise.all(
    Object.values(mongoose.models).map(async (model) => ({
      model: model.modelName,
      indexes: await model.syncIndexes(),
    }))
  );
  logger.info({ results }, 'MongoDB indexes synchronized');
  await disconnectDatabase();
}

void main().catch((error) => {
  logger.fatal({ error }, 'Unable to synchronize MongoDB indexes');
  process.exitCode = 1;
});
