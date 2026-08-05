import type { FilterQuery, UpdateQuery } from 'mongoose';
import { Task, type ITask } from '../models/Task';

interface TaskModelLike {
  create(input: Partial<ITask>): Promise<any>;
  findOneAndUpdate(
    filter: FilterQuery<ITask>,
    update: UpdateQuery<ITask>,
    options: Record<string, unknown>
  ): any;
}

export class TaskService {
  constructor(private readonly model: TaskModelLike = Task) {}

  create(input: Partial<ITask>) {
    return this.model.create(input);
  }

  update(filter: FilterQuery<ITask>, update: UpdateQuery<ITask>) {
    return this.model.findOneAndUpdate(filter, update, { new: true, runValidators: true });
  }

  remove(filter: FilterQuery<ITask>) {
    return this.model.findOneAndUpdate(
      filter,
      { $set: { removed: true } },
      { new: true, runValidators: true }
    );
  }
}

export const taskService = new TaskService();
