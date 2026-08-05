import { Types } from 'mongoose';
import { z } from 'zod';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { UserCredential } from '../models/UserCredential';
import { Workspace } from '../models/Workspace';
import { hashPassword } from '../services/authService';
import { toSlug } from '../utils/slug';

const setupEnvSchema = z.object({
  OWNER_NAME: z.string().min(2),
  OWNER_EMAIL: z.string().email(),
  OWNER_PASSWORD: z.string().min(8),
  WORKSPACE_NAME: z.string().min(2),
});

async function main() {
  const input = setupEnvSchema.parse(process.env);
  await connectDatabase();

  const existingUser = await User.findOne({ email: input.OWNER_EMAIL.toLowerCase() });
  let user = existingUser;
  let workspace = existingUser?.workspace
    ? await Workspace.findById(existingUser.workspace)
    : null;

  if (!workspace) {
    const workspaceId = new Types.ObjectId();
    const userId = existingUser?._id ?? new Types.ObjectId();
    workspace = await Workspace.create({
      _id: workspaceId,
      name: input.WORKSPACE_NAME,
      slug: `${toSlug(input.WORKSPACE_NAME)}-${workspaceId.toString().slice(-6)}`,
      owner: userId,
    });
    if (user) {
      user.workspace = workspace._id;
      user.role = 'owner';
      user.enabled = true;
      user.removed = false;
      await user.save();
    } else {
      user = await User.create({
        _id: userId,
        workspace: workspace._id,
        name: input.OWNER_NAME,
        email: input.OWNER_EMAIL.toLowerCase(),
        role: 'owner',
        enabled: true,
      });
    }
  }

  const credential = await UserCredential.findOne({ user: user!._id });
  if (!credential) {
    await UserCredential.create({
      user: user!._id,
      ...hashPassword(input.OWNER_PASSWORD),
      emailVerified: true,
    });
  }

  console.log(`WorkClub is ready for ${user!.email} in ${workspace.name}.`);
  await disconnectDatabase();
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
