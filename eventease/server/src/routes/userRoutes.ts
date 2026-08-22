import { Router } from 'express';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../utils/errorHandler';
import * as dashboard from '../controllers/dashboardController';
import * as users from '../controllers/userController';
import { recommendationService } from '../services/recommendationService';

const router = Router();

router.get('/dashboard', protect, dashboard.getDashboard);
router.get('/search', protect, users.search);
router.get('/profile', protect, users.getProfile);

router.post('/recommendations', protect, asyncHandler(async (req, res) => {
  const { eventType, location, guestCount, budget } = req.body as {
    eventType?: string; location?: string; guestCount?: number; budget?: number;
  };
  const recommendations = await recommendationService.getRecommendations({ eventType, location, guestCount, budget });
  res.json({ success: true, data: { recommendations } });
}));

export default router;
