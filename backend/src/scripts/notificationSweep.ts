import { connectDatabase, disconnectDatabase } from '../config/database';
import { runNotificationSweep } from '../services/notificationSweep';

async function main() {
  await connectDatabase();
  const result = await runNotificationSweep();
  console.log('Notification sweep complete:', result);
  await disconnectDatabase();
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
