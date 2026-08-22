import { Router } from 'express';
import * as admin from '../controllers/adminController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect, authorize('admin'));

// Dashboard
router.get('/dashboard', admin.getDashboard);

// Users
router.get('/users', admin.getUsers);
router.get('/users/:id', admin.getUserDetail);
router.put('/users/:id/status', admin.updateUserStatus);
router.delete('/users/:id', admin.deleteUser);

// Vendors
router.get('/vendors', admin.getAdminVendors);
router.put('/vendors/:id/verification', admin.setVendorVerification);

// Venues
router.get('/venues', async (req, res, next) => {
  req.url = `/?${new URLSearchParams(req.query as Record<string, string>).toString()}`;
  (await import('../controllers/venueController')).getVenues(req, res, next);
});
router.put('/venues/:id/verification', admin.setVenueVerification);

// Events
router.get('/events', admin.getAdminEvents);

// Bookings
router.get('/bookings', admin.getAdminBookings);

// Payments
router.get('/payments', admin.getAdminPayments);

// Reviews
router.get('/reviews', admin.getAdminReviews);
router.put('/reviews/:id/moderate', admin.moderateReview);

export default router;
