import { Router } from 'express';
import * as guests from '../controllers/guestController';
import { protect } from '../middleware/auth';
import { validate, guestSchema } from '../validators';

const router = Router();

router.use(protect);

router.get('/:eventId/guests', guests.getGuests);
router.post('/:eventId/guests', validate({ body: guestSchema }), guests.createGuest);
router.put('/:eventId/guests/:id', validate({ body: guestSchema.partial() }), guests.updateGuest);
router.delete('/:eventId/guests/:id', guests.deleteGuest);
router.post('/:eventId/guests/:id/invite', guests.sendInvitation);

export default router;
