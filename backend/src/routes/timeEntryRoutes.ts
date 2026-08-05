import { Router } from "express";
import {
  authorize,
  memberTaskScope,
  workspaceScope,
} from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { Task } from "../models/Task";
import { TimeEntry } from "../models/TimeEntry";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { timeEntrySchemas } from "../validation/schemas";

export const timeEntryRoutes = Router();
timeEntryRoutes.use(authorize("owner", "manager", "member"));

timeEntryRoutes.post(
  "/start",
  validate({ body: timeEntrySchemas.start }),
  asyncHandler(async (req, res) => {
    const task = await Task.findOne({
      _id: req.body.task,
      ...memberTaskScope(req),
    });
    if (!task)
      throw new ApiError(404, "Task not found or not assigned to you.");
    if (
      await TimeEntry.exists({
        ...workspaceScope(req),
        user: req.user!._id,
        running: true,
      })
    ) {
      throw new ApiError(
        409,
        "Stop your current timer before starting another.",
      );
    }
    const entry = await TimeEntry.create({
      workspace: req.user!.workspace,
      project: task.project,
      task: task._id,
      user: req.user!._id,
      startAt: new Date(),
      running: true,
      billable: req.body.billable,
      notes: req.body.notes,
    });
    res.status(201).json({ success: true, result: entry });
  }),
);

timeEntryRoutes.patch(
  "/:id/stop",
  validate({ params: timeEntrySchemas.params, body: timeEntrySchemas.stop }),
  asyncHandler(async (req, res) => {
    const entry = await TimeEntry.findOne({
      _id: req.params.id,
      ...workspaceScope(req),
      user: req.user!._id,
      running: true,
    });
    if (!entry) throw new ApiError(404, "Running timer not found.");
    const endAt = new Date();
    entry.endAt = endAt;
    entry.durationMinutes = Math.max(
      1,
      Math.round((endAt.getTime() - entry.startAt.getTime()) / 60_000),
    );
    entry.running = false;
    if (req.body.notes !== undefined) entry.notes = req.body.notes;
    await entry.save();
    res.json({ success: true, result: entry });
  }),
);

timeEntryRoutes.post(
  "/manual",
  validate({ body: timeEntrySchemas.manual }),
  asyncHandler(async (req, res) => {
    const task = await Task.findOne({
      _id: req.body.task,
      ...memberTaskScope(req),
    });
    if (!task)
      throw new ApiError(404, "Task not found or not assigned to you.");
    const endAt = new Date(
      req.body.startAt.getTime() + req.body.durationMinutes * 60_000,
    );
    const entry = await TimeEntry.create({
      ...req.body,
      workspace: req.user!.workspace,
      project: task.project,
      user: req.user!._id,
      endAt,
      running: false,
    });
    res.status(201).json({ success: true, result: entry });
  }),
);

timeEntryRoutes.get(
  "/weekly",
  validate({ query: timeEntrySchemas.weekly }),
  asyncHandler(async (req, res) => {
    const { weekStart } = timeEntrySchemas.weekly.parse(req.query);
    const requestedUser = req.query.user as string | undefined;
    if (
      req.user!.role === "member" &&
      requestedUser &&
      requestedUser !== req.user!._id.toString()
    ) {
      throw new ApiError(403, "Members can only view their own timesheet.");
    }
    const user = requestedUser ?? req.user!._id;
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 7);
    const entries = await TimeEntry.find({
      ...workspaceScope(req),
      user,
      startAt: { $gte: start, $lt: end },
    })
      .populate("task", "title status")
      .populate("project", "name code")
      .sort({ startAt: -1 })
      .lean();
    const totalMinutes = entries.reduce(
      (sum, entry) => sum + entry.durationMinutes,
      0,
    );
    const billableMinutes = entries
      .filter((entry) => entry.billable)
      .reduce((sum, entry) => sum + entry.durationMinutes, 0);
    res.json({
      success: true,
      result: {
        entries,
        totalMinutes,
        billableMinutes,
        weekStart,
        weekEnd: end,
      },
    });
  }),
);

timeEntryRoutes.get(
  "/running",
  asyncHandler(async (req, res) => {
    const entry = await TimeEntry.findOne({
      ...workspaceScope(req),
      user: req.user!._id,
      running: true,
    })
      .populate("task", "title")
      .lean();
    res.json({ success: true, result: entry });
  }),
);

timeEntryRoutes.get(
  "/billable",
  authorize("owner", "manager"),
  validate({ query: timeEntrySchemas.billable }),
  asyncHandler(async (req, res) => {
    const entries = await TimeEntry.find({
      ...workspaceScope(req),
      project: req.query.project,
      billable: true,
      running: false,
      invoice: { $exists: false },
      durationMinutes: { $gt: 0 },
      $or: [
        { invoiceReservation: { $exists: false } },
        { invoiceReservationExpiresAt: { $lt: new Date() } },
      ],
    })
      .populate("task", "title")
      .populate("user", "name")
      .sort({ startAt: 1 })
      .lean();
    res.json({ success: true, result: entries });
  }),
);

timeEntryRoutes.delete(
  "/:id",
  validate({ params: timeEntrySchemas.params }),
  asyncHandler(async (req, res) => {
    const query: Record<string, unknown> = {
      _id: req.params.id,
      ...workspaceScope(req),
      invoice: { $exists: false },
      running: false,
    };
    if (req.user!.role === "member") query.user = req.user!._id;
    const entry = await TimeEntry.findOneAndUpdate(
      query,
      { removed: true },
      { new: true },
    );
    if (!entry) throw new ApiError(404, "Editable time entry not found.");
    res.json({ success: true, result: entry });
  }),
);
