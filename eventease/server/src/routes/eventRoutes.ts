import { Router } from 'express';
import * as events from '../controllers/eventController';
import { protect, authorize } from '../middleware/auth';
import { validate, eventSchema } from '../validators';

const router = Router();

router.use(protect);

router.route('/')
  .get(events.getEvents)
  .post(authorize('customer', 'admin'), validate({ body: eventSchema }), events.createEvent);

router.route('/:id')
  .get(events.getEvent)
  .put(validate({ body: eventSchema.partial() }), events.updateEvent)
  .delete(events.deleteEvent);

export default router;
