import { Router } from 'express';
import * as vendors from '../controllers/vendorController';
import * as services from '../controllers/serviceController';
import { protect, authorize } from '../middleware/auth';
import { validate, vendorSchema, serviceSchema } from '../validators';

const router = Router();

// Vendor profile routes (vendor role)
router.get('/me/profile', protect, authorize('vendor'), vendors.getMyVendorProfile);
router.post('/me/profile', protect, authorize('vendor'), validate({ body: vendorSchema }), vendors.createOrUpdateVendorProfile);
router.put('/me/profile', protect, authorize('vendor'), validate({ body: vendorSchema.partial() }), vendors.createOrUpdateVendorProfile);
router.get('/me/stats', protect, authorize('vendor'), vendors.getVendorStats);

// Services
router.get('/me/services', protect, authorize('vendor'), services.getMyServices);
router.post('/me/services', protect, authorize('vendor'), validate({ body: serviceSchema }), services.createService);
router.put('/me/services/:id', protect, authorize('vendor'), validate({ body: serviceSchema.partial() }), services.updateService);
router.delete('/me/services/:id', protect, authorize('vendor'), services.deleteService);

// Review responses
router.put('/reviews/:id/respond', protect, authorize('vendor'), vendors.respondToReview);

// Public routes
router.get('/', vendors.getVendors);
router.get('/:id', vendors.getVendor);

export default router;
