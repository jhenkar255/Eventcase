import { Router } from 'express';
import * as reviews from '../controllers/reviewController';
import { protect, optionalAuth } from '../middleware/authOptional';
import { validate, reviewSchema } from '../validators';

const router = Router();

router.get('/', optionalAuth, reviews.getReviews);

router.use(protect);
router.post('/', validate({ body: reviewSchema }), reviews.createReview);
router.put('/:id', reviews.updateReview);
router.delete('/:id', reviews.deleteReview);
router.get('/me/reviews', reviews.getMyReviews);

export default router;
