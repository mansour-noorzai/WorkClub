import { TaskService } from '../src/services/taskService';

describe('task CRUD service', () => {
  const created = { _id: 'task-1', title: 'Prepare kickoff', removed: false };
  const model = {
    create: jest.fn().mockResolvedValue(created),
    findOneAndUpdate: jest.fn(),
  };
  const service = new TaskService(model as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a task through the repository', async () => {
    await expect(service.create({ title: 'Prepare kickoff' } as never)).resolves.toEqual(created);
    expect(model.create).toHaveBeenCalledWith({ title: 'Prepare kickoff' });
  });

  it('updates a task with validation enabled', async () => {
    model.findOneAndUpdate.mockResolvedValue({ ...created, status: 'done' });
    await expect(service.update({ _id: 'task-1' }, { status: 'done' })).resolves.toMatchObject({
      status: 'done',
    });
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'task-1' },
      { status: 'done' },
      { new: true, runValidators: true }
    );
  });

  it('soft-deletes a task so related time history remains intact', async () => {
    model.findOneAndUpdate.mockResolvedValue({ ...created, removed: true });
    await expect(service.remove({ _id: 'task-1' })).resolves.toMatchObject({ removed: true });
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'task-1' },
      { $set: { removed: true } },
      { new: true, runValidators: true }
    );
  });
});
