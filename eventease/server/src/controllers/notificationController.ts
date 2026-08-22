import { Notification } from '../models/Notification';
import { asyncHandler } from '../utils/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = asyncHandler(async (req: AuthRequest, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);

  const [notifications, total, unread] = await Promise.all([
    Notification.find({ userId: req.user!.id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Notification.countDocuments({ userId: req.user!.id }),
    Notification.countDocuments({ userId: req.user!.id, read: false }),
  ]);

  res.json({ success: true, data: { notifications, unread, total, page, pages: Math.ceil(total / limit) || 1 } });
});

export const markAsRead = asyncHandler(async (req: AuthRequest, res) => {
  await Notification.updateOne({ _id: req.params.id, userId: req.user!.id }, { read: true });
  res.json({ success: true, message: 'Notification marked as read' });
});

export const markAllAsRead = asyncHandler(async (req: AuthRequest, res) => {
  const result = await Notification.updateMany({ userId: req.user!.id, read: false }, { read: true });
  res.json({ success: true, message: `${result.modifiedCount} notifications marked as read` });
});
