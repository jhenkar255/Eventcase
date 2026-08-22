import { Task } from '../models/Task';
import { asyncHandler } from '../utils/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { requireEventOwnership } from './guestController';

export const getTasks = asyncHandler(async (req: AuthRequest, res) => {
  const event = await requireEventOwnership(req.params.eventId, req.user!.id, req.user!.role);
  const filter: Record<string, unknown> = { eventId: event._id };
  if (req.query.status) filter.status = req.query.status;

  const tasks = await Task.find(filter).sort({ date: 1, startTime: 1 }).lean();
  res.json({ success: true, data: { tasks } });
});

export const createTask = asyncHandler(async (req: AuthRequest, res) => {
  const event = await requireEventOwnership(req.params.eventId, req.user!.id, req.user!.role);
  const task = await Task.create({ ...req.body, eventId: event._id });
  res.status(201).json({ success: true, message: 'Task created', data: { task } });
});

export const updateTask = asyncHandler(async (req: AuthRequest, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  await requireEventOwnership(String(task.eventId), req.user!.id, req.user!.role);

  Object.assign(task, req.body);
  await task.save();
  res.json({ success: true, message: 'Task updated', data: { task } });
});

export const deleteTask = asyncHandler(async (req: AuthRequest, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  await requireEventOwnership(String(task.eventId), req.user!.id, req.user!.role);

  await task.deleteOne();
  res.json({ success: true, message: 'Task deleted' });
});
