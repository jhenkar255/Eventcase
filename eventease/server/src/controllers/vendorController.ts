import { Vendor, VENDOR_CATEGORIES } from '../models/Vendor';
import { Service } from '../models/Service';
import { Review } from '../models/Review';
import { Booking } from '../models/Booking';
import { asyncHandler } from '../utils/errorHandler';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../middleware/auth';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getVendors = asyncHandler(async (req: AuthRequest, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 12);

  const filter: Record<string, unknown> = { status: 'active' };
  // Only show approved vendors publicly; admins see everything via admin routes
  if (req.user?.role !== 'admin') filter.verificationStatus = 'approved';

  if (req.query.category) filter.category = req.query.category;
  if (req.query.location) {
    filter.location = new RegExp(escapeRegex(String(req.query.location)), 'i');
  }
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(String(req.query.search)), 'i');
    filter.$or = [{ businessName: rx }, { location: rx }, { description: rx }, { category: rx }];
  }
  if (req.query.minPrice || query_maxPrice(req)) {
    const pf: Record<string, number> = {};
    if (req.query.minPrice) pf.$gte = Number(req.query.minPrice);
    if (query_maxPrice(req)) pf.$lte = Number(query_maxPrice(req));
    filter.startingPrice = pf;
  }
  if (req.query.minRating) filter.rating = { $gte: Number(req.query.minRating) };

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    price_asc: { startingPrice: 1 },
    price_desc: { startingPrice: -1 },
    rating: { rating: -1 },
    newest: { createdAt: -1 },
  };
  const sort = sortMap[String(req.query.sort)] || { rating: -1 };

  const [vendors, total] = await Promise.all([
    Vendor.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Vendor.countDocuments(filter),
  ]);

  res.json({ success: true, data: { vendors, total, page, pages: Math.ceil(total / limit) || 1 } });
});

function query_maxPrice(req: { query: Record<string, unknown> }) {
  return req.query.maxPrice;
}

export const getVendor = asyncHandler(async (req: AuthRequest, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) throw ApiError.notFound('Vendor not found');

  const isOwner = req.user && String(vendor.userId) === req.user.id;
  if (!isOwner && req.user?.role !== 'admin') {
    if (vendor.verificationStatus !== 'approved' || vendor.status !== 'active') {
      throw ApiError.notFound('Vendor not found');
    }
  }

  const [services, reviews] = await Promise.all([
    Service.find({ vendorId: vendor._id, status: 'active' }).sort({ createdAt: -1 }).lean(),
    Review.find({ vendorId: vendor._id })
      .populate('customerId', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  res.json({ success: true, data: { vendor, services, reviews } });
});

export const getMyVendorProfile = asyncHandler(async (req: AuthRequest, res) => {
  const vendor = await Vendor.findOne({ userId: req.user!.id });
  if (!vendor) throw ApiError.notFound('Vendor profile not found');

  res.json({ success: true, data: { vendor } });
});

export const createOrUpdateVendorProfile = asyncHandler(async (req: AuthRequest, res) => {
  let vendor = await Vendor.findOne({ userId: req.user!.id });

  if (vendor) {
    const wasRejectedOrPending = vendor.verificationStatus !== 'approved';
    Object.assign(vendor, req.body);
    if (wasRejectedOrPending || Object.keys(req.body as Record<string, unknown>).some((k) => ['businessName', 'category', 'location'].includes(k))) {
      // keep approved vendors verified; re-submit only if they edit core identity fields while pending/rejected
      if (vendor.verificationStatus === 'pending' || vendor.verificationStatus === 'rejected') {
        vendor.verificationStatus = 'pending';
        vendor.verified = false;
      }
    }
    await vendor.save();
  } else {
    vendor = await Vendor.create({
      ...req.body,
      userId: req.user!.id,
      verificationStatus: 'pending',
    });
  }

  res.json({ success: true, message: 'Vendor profile saved. Pending admin approval.', data: { vendor } });
});

export const getVendorStats = asyncHandler(async (req: AuthRequest, res) => {
  const vendor = await Vendor.findOne({ userId: req.user!.id });
  if (!vendor) throw ApiError.notFound('Vendor profile not found');

  const [bookings, services] = await Promise.all([
    Booking.find({ vendorId: vendor._id }).populate('customerId', 'name').populate('eventId', 'name type').lean(),
    Service.find({ vendorId: vendor._id }).countDocuments(),
  ]);

  const completed = bookings.filter((b) => b.status === 'completed');
  const earnings = completed.reduce((sum, b) => sum + b.amount, 0);

  const upcoming = bookings
    .filter((b) => b.status === 'confirmed' && new Date(b.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  res.json({
    success: true,
    data: {
      stats: {
        totalBookings: bookings.length,
        pendingBookings: bookings.filter((b) => b.status === 'pending').length,
        confirmedBookings: bookings.filter((b) => b.status === 'confirmed').length,
        completedBookings: completed.length,
        totalEarnings: earnings,
        averageRating: vendor.rating,
        reviewCount: vendor.reviewCount,
        serviceCount: services,
      },
      upcomingBookings: upcoming.slice(0, 5),
    },
  });
});

export const getVendorAvailability = asyncHandler(async (req: AuthRequest, res) => {
  const vendor = await Vendor.findOne({ userId: req.user!.id });
  if (!vendor) throw ApiError.notFound('Vendor profile not found');
  res.json({ success: true, data: { availability: vendor.availability } });
});

export const updateVendorAvailability = asyncHandler(async (req: AuthRequest, res) => {
  const vendor = await Vendor.findOne({ userId: req.user!.id });
  if (!vendor) throw ApiError.notFound('Vendor profile not found');

  const { availability } = req.body as { availability: Array<{ day: string; open: boolean; from: string; to: string }> };
  if (!Array.isArray(availability) || availability.length !== 7) {
    throw ApiError.badRequest('Availability must contain all 7 days');
  }
  for (const a of availability) {
    if (!a.day) throw ApiError.badRequest('Each entry must have a day');
    const timeRe = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if ((a.open && !timeRe.test(a.from)) || (a.open && !timeRe.test(a.to))) {
      throw ApiError.badRequest('Times must be in HH:MM format');
    }
    if (a.open && a.from >= a.to) {
      throw ApiError.badRequest(`End time must be after start time for ${a.day}`);
    }
  }

  vendor.availability = availability;
  await vendor.save();
  res.json({ success: true, message: 'Availability updated', data: { availability: vendor.availability } });
});

export const respondToReview = asyncHandler(async (req: AuthRequest, res) => {
  const { response } = req.body as { response: string };
  if (!response || !response.trim()) throw ApiError.badRequest('Response text is required');

  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');

  const vendor = await Vendor.findOne({ userId: req.user!.id });
  if (!vendor || String(review.vendorId) !== String(vendor._id)) {
    throw ApiError.forbidden('You can only respond to reviews for your business');
  }

  review.response = response.trim();
  await review.save();

  const { sendNotification } = await import('../services/notificationService');
  await sendNotification(
    String(review.customerId),
    'Vendor responded to your review',
    `${vendor.businessName} responded to your review.`,
    'review-response',
    '/bookings'
  );

  res.json({ success: true, message: 'Response posted', data: { review } });
});
