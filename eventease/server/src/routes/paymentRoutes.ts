import { Router } from 'express';
import * as payments from '../controllers/paymentController';
import { protect, authorize } from '../middleware/auth';
import { validate } from '../validators';
import { z } from 'zod';

const router = Router();

router.use(protect);

const paymentBodySchema = z.object({
  bookingId: z.string().min(1, 'Booking is required'),
  paymentMethod: z.enum(['card', 'upi', 'netbanking', 'wallet']).default('card'),
});

router.post('/', authorize('customer', 'admin'), validate({ body: paymentBodySchema }), payments.createPayment);
router.get('/', payments.getMyPayments);
router.get('/:id', payments.getPayment);

export default router;
