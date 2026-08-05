import { Router } from "express";
import {
  authorize,
  memberTaskScope,
  workspaceScope,
} from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { Project } from "../models/Project";
import { Task } from "../models/Task";
import { TimeEntry } from "../models/TimeEntry";
import { User } from "../models/User";
import { createNotification } from "../services/notificationService";
import { taskService } from "../services/taskService";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { pagination } from "../utils/pagination";
import { taskSchemas } from "../validation/schemas";

export const taskRoutes = Router();

taskRoutes.get(
  "/",
  authorize("owner", "manager", "member"),
  validate({ query: taskSchemas.list }),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req.query as never);
    const { search, project, status, assignee } = req.query as Record<
      string,
      string | undefined
    >;
    const query: Record<string, unknown> = memberTaskScope(req);
    if (project) query.project = project;
    if (status) query.status = status;
    if (assignee && req.user!.role !== "member") query.assignee = assignee;
    if (search) query.title = { $regex: escapeRegex(search), $options: "i" };
    const [items, total] = await Promise.all([
      Task.find(query)
        .populate("assignee", "name email photo role")
        .populate("project", "name code")
        .sort({ status: 1, sortOrder: 1, dueDate: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.countDocuments(query),
    ]);
    res.json({ success: true, result: items, meta: { page, limit, total } });
  }),
);

taskRoutes.post(
  "/",
  authorize("owner", "manager"),
  validate({ body: taskSchemas.create }),
  asyncHandler(async (req, res) => {
    await assertTaskRelations(
      req.user!.workspace,
      req.body.project,
      req.body.assignee,
    );
    const task = await taskService.create({
      ...req.body,
      workspace: req.user!.workspace,
      createdBy: req.user!._id,
    });
    await createNotification({
      workspace: req.user!.workspace,
      user: task.assignee,
      type: "task_assigned",
      title: "New task assigned",
      message: `You were assigned “${task.title}”.`,
      metadata: {
        taskId: task._id.toString(),
        projectId: task.project.toString(),
      },
      dedupeKey: `task-assigned:${task._id}:${task.assignee}:${task.updatedAt.getTime()}`,
      sendEmail: true,
    });
    res.status(201).json({ success: true, result: task });
  }),
);

taskRoutes.get(
  "/:id",
  authorize("owner", "manager", "member"),
  validate({ params: taskSchemas.params }),
  asyncHandler(async (req, res) => {
    const task = await Task.findOne({
      _id: req.params.id,
      ...memberTaskScope(req),
    })
      .populate("assignee", "name email photo role")
      .populate("comments.author", "name photo")
      .lean();
    if (!task) throw new ApiError(404, "Task not found.");
    res.json({ success: true, result: task });
  }),
);

taskRoutes.patch(
  "/:id",
  authorize("owner", "manager"),
  validate({ params: taskSchemas.params, body: taskSchemas.update }),
  asyncHandler(async (req, res) => {
    const existing = await Task.findOne({
      _id: req.params.id,
      ...workspaceScope(req),
    });
    if (!existing) throw new ApiError(404, "Task not found.");
    const assigneeChanged = Boolean(
      req.body.assignee && req.body.assignee !== existing.assignee.toString(),
    );
    if (assigneeChanged) {
      await assertTaskRelations(
        req.user!.workspace,
        existing.project.toString(),
        req.body.assignee,
      );
    }
    const task = await taskService.update(
      { _id: req.params.id, ...workspaceScope(req) },
      req.body,
    );
    if (assigneeChanged && task) {
      await createNotification({
        workspace: req.user!.workspace,
        user: task.assignee,
        type: "task_assigned",
        title: "Task assigned",
        message: `You were assigned “${task.title}”.`,
        metadata: {
          taskId: task._id.toString(),
          projectId: task.project.toString(),
        },
        dedupeKey: `task-assigned:${task._id}:${task.assignee}:${task.updatedAt.getTime()}`,
        sendEmail: true,
      });
    }
    res.json({ success: true, result: task });
  }),
);

taskRoutes.patch(
  "/:id/move",
  authorize("owner", "manager", "member"),
  validate({ params: taskSchemas.params, body: taskSchemas.move }),
  asyncHandler(async (req, res) => {
    const task = await taskService.update(
      { _id: req.params.id, ...memberTaskScope(req) },
      req.body,
    );
    if (!task)
      throw new ApiError(404, "Task not found or not assigned to you.");
    res.json({ success: true, result: task });
  }),
);

taskRoutes.post(
  "/:id/comments",
  authorize("owner", "manager", "member"),
  validate({ params: taskSchemas.params, body: taskSchemas.comment }),
  asyncHandler(async (req, res) => {
    const task = await taskService.update(
      { _id: req.params.id, ...memberTaskScope(req) },
      {
        $push: {
          comments: { author: req.user!._id, message: req.body.message },
        },
      },
    );
    if (!task)
      throw new ApiError(404, "Task not found or not assigned to you.");
    res.json({ success: true, result: task });
  }),
);

taskRoutes.delete(
  "/:id",
  authorize("owner", "manager"),
  validate({ params: taskSchemas.params }),
  asyncHandler(async (req, res) => {
    if (
      await TimeEntry.exists({
        task: req.params.id,
        ...workspaceScope(req),
        running: true,
      })
    ) {
      throw new ApiError(409, "Stop the running timer before deleting this task.");
    }
    const task = await taskService.remove({
      _id: req.params.id,
      ...workspaceScope(req),
    });
    if (!task) throw new ApiError(404, "Task not found.");
    res.json({ success: true, result: task });
  }),
);

async function assertTaskRelations(
  workspace: unknown,
  projectId: string,
  assigneeId: string,
) {
  const [project, assignee] = await Promise.all([
    Project.findOne({ _id: projectId, workspace, removed: false }),
    User.exists({
      _id: assigneeId,
      workspace,
      removed: false,
      enabled: true,
      role: { $in: ["owner", "manager", "member"] },
    }),
  ]);
  if (!project)
    throw new ApiError(422, "Project does not belong to this workspace.");
  if (!assignee)
    throw new ApiError(422, "Assignee does not belong to this workspace.");
  if (
    !project.teamMembers.some(
      (member: import("mongoose").Types.ObjectId) =>
        member.toString() === assigneeId,
    )
  ) {
    throw new ApiError(422, "Assignee must be a member of the project team.");
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
