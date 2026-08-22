import { Router } from 'express';
import * as venues from '../controllers/venueController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/', venues.getVenues);
router.get('/:id', venues.getVenue);
router.get('/:id/availability', venues.getVenueAvailability);

router.post('/', protect, authorize('admin'), venues.createVenue);
router.put('/:id', protect, authorize('admin'), venues.updateVenue);
router.delete('/:id', protect, authorize('admin'), venues.deleteVenue);

export default router;
