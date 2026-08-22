import { Router } from 'express';
import * as notifications from '../controllers/notificationController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', notifications.getNotifications);
router.put('/read-all', notifications.markAllAsRead);
router.put('/:id/read', notifications.markAsRead);

export default router;
