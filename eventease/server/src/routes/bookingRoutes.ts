import { Router } from 'express';
import * as bookings from '../controllers/bookingController';
import { protect, authorize } from '../middleware/auth';
import { validate, bookingCreateSchema, bookingUpdateSchema } from '../validators';

const router = Router();

router.use(protect);

router.get('/', authorize('customer', 'vendor', 'admin'), bookings.getBookings);
router.post('/', authorize('customer', 'admin'), validate({ body: bookingCreateSchema }), bookings.createBooking);
router.put('/:id', validate({ body: bookingUpdateSchema }), bookings.updateBookingStatus);
router.delete('/:id', bookings.cancelBooking);
router.get('/:id', bookings.getBooking);

export default router;
