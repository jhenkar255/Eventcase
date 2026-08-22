import { User } from '../models/User';
import { Vendor } from '../models/Vendor';
import { Venue } from '../models/Venue';
import { Event } from '../models/Event';
import { Booking } from '../models/Booking';
import { Review } from '../models/Review';
import { Payment } from '../models/Payment';
import { Service } from '../models/Service';
import { asyncHandler } from '../utils/errorHandler';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../middleware/auth';
import { sendNotification } from '../services/notificationService';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getDashboard = asyncHandler(async (_req: AuthRequest, res) => {
  const [
    totalUsers, totalVendors, pendingVendors, totalVenues,
    totalEvents, totalBookings, totalReviews,
  ] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Vendor.countDocuments(),
    Vendor.countDocuments({ verificationStatus: 'pending' }),
    Venue.countDocuments(),
    Event.countDocuments(),
    Booking.countDocuments(),
    Review.countDocuments(),
  ]);

  const revenueAgg = await Payment.aggregate([
    { $match: { status: 'successful' } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const totalRevenue = revenueAgg[0]?.total || 0;

  // Charts data
  const [usersByMonth, eventsByCategory, bookingsByStatus, revenueByMonth, reviewsByRating] = await Promise.all([
    User.aggregate([
      { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]),
    Event.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Payment.aggregate([
      { $match: { status: 'successful' } },
      { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        total: { $sum: '$amount' },
      } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Review.aggregate([{ $group: { _id: '$rating', count: { $sum: 1 } } }, { $sort: { _id: -1 } }]),
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        totalUsers, totalVendors, pendingVendors, totalVenues,
        totalEvents, totalBookings, totalReviews, totalRevenue,
        successfulPayments: revenueAgg[0]?.count || 0,
      },
      charts: {
        usersByMonth: usersByMonth.map((u) => ({ month: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][u._id.month - 1]} ${String(u._id.year).slice(2)}`, users: u.count })),
        eventsByCategory: eventsByCategory.map((e) => ({ name: e._id, value: e.count })),
        bookingsByStatus: bookingsByStatus.map((b) => ({ name: b._id, value: b.count })),
        revenueByMonth: revenueByMonth.map((r) => ({ month: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][r._id.month - 1]} ${String(r._id.year).slice(2)}`, revenue: r.total })),
        reviewsByRating: reviewsByRating.map((r) => ({ rating: `${r._id} Star`, count: r.count })),
      },
    },
  });
});

// ---- Users ----
export const getUsers = asyncHandler(async (req: AuthRequest, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 15);
  const filter: Record<string, unknown> = {};

  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(String(req.query.search)), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      users: users.map(({ password, ...rest }) => rest),
      total, page, pages: Math.ceil(total / limit) || 1,
    },
  });
});

export const getUserDetail = asyncHandler(async (req: AuthRequest, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user) throw ApiError.notFound('User not found');
  const { password, ...safeUser } = user;

  const [eventsCount, bookingsCount] = await Promise.all([
    Event.countDocuments({ userId: user._id }),
    Booking.countDocuments({ customerId: user._id }),
  ]);

  let vendorProfile = null;
  if (user.role === 'vendor') {
    vendorProfile = await Vendor.findOne({ userId: user._id }).lean();
  }

  res.json({ success: true, data: { user: safeUser, eventsCount, bookingsCount, vendorProfile } });
});

export const updateUserStatus = asyncHandler(async (req: AuthRequest, res) => {
  const { status } = req.body as { status: 'active' | 'suspended' | 'deleted' };
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user.role === 'admin') throw ApiError.forbidden('Cannot modify admin accounts');

  user.status = status;
  await user.save();

  if (status === 'suspended' && user.role === 'vendor') {
    await Vendor.updateOne({ userId: user._id }, { status: 'suspended' });
  }
  if (status === 'active' && user.role === 'vendor') {
    await Vendor.updateOne({ userId: user._id }, { status: 'active' });
  }

  await sendNotification(String(user._id), 'Account update', `Your account status is now "${status}".`, 'account');

  res.json({ success: true, message: `User ${status}`, data: { user: { id: user._id, status: user.status } } });
});

export const deleteUser = asyncHandler(async (req: AuthRequest, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user.role === 'admin') throw ApiError.forbidden('Cannot delete admin accounts');

  if (user.role === 'vendor') {
    const vendor = await Vendor.findOne({ userId: user._id });
    if (vendor) {
      await Service.deleteMany({ vendorId: vendor._id });
      await vendor.deleteOne();
    }
  }

  await user.deleteOne();
  res.json({ success: true, message: 'User deleted' });
});

// ---- Vendors ----
export const getAdminVendors = asyncHandler(async (req: AuthRequest, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 15);
  const filter: Record<string, unknown> = {};

  if (req.query.verificationStatus) filter.verificationStatus = req.query.verificationStatus;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(String(req.query.search)), 'i');
    filter.$or = [{ businessName: rx }, { location: rx }];
  }

  const [vendors, total] = await Promise.all([
    Vendor.find(filter).populate('userId', 'name email phone status').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Vendor.countDocuments(filter),
  ]);

  res.json({ success: true, data: { vendors, total, page, pages: Math.ceil(total / limit) || 1 } });
});

export const setVendorVerification = asyncHandler(async (req: AuthRequest, res) => {
  const { decision } = req.body as { decision: 'approved' | 'rejected' };
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) throw ApiError.notFound('Vendor not found');

  vendor.verificationStatus = decision;
  vendor.verified = decision === 'approved';
  await vendor.save();

  await sendNotification(
    String(vendor.userId),
    decision === 'approved' ? 'Vendor account approved 🎉' : 'Vendor application rejected',
    decision === 'approved'
      ? 'Congratulations! Your vendor profile is verified and live.'
      : `Your vendor profile was rejected. You may edit and resubmit.`,
    'account',
    '/vendor/profile'
  );

  res.json({ success: true, message: `Vendor ${decision}`, data: { vendor } });
});

// ---- Venues ----
export const setVenueVerification = asyncHandler(async (req: AuthRequest, res) => {
  const { decision } = req.body as { decision: 'approved' | 'rejected' };
  const venue = await Venue.findById(req.params.id);
  if (!venue) throw ApiError.notFound('Venue not found');

  venue.verificationStatus = decision;
  await venue.save();
  res.json({ success: true, message: `Venue ${decision}`, data: { venue } });
});

// ---- Bookings ----
export const getAdminBookings = asyncHandler(async (req: AuthRequest, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 15);
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('customerId', 'name email')
      .populate('eventId', 'name type')
      .populate('vendorId', 'businessName category')
      .populate('venueId', 'name location')
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  res.json({ success: true, data: { bookings, total, page, pages: Math.ceil(total / limit) || 1 } });
});

// ---- Payments ----
export const getAdminPayments = asyncHandler(async (req: AuthRequest, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 15);
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('customerId', 'name email')
      .populate({ path: 'bookingId', populate: [{ path: 'vendorId', select: 'businessName' }, { path: 'venueId', select: 'name' }] })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Payment.countDocuments(filter),
  ]);

  const agg = await Payment.aggregate([{ $match: { status: 'successful' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);

  res.json({ success: true, data: { payments, totalRevenue: agg[0]?.total || 0, total, page, pages: Math.ceil(total / limit) || 1 } });
});

// ---- Reviews moderation ----
export const getAdminReviews = asyncHandler(async (req: AuthRequest, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 15);
  const filter: Record<string, unknown> = {};
  // Admin sees all statuses
  if (req.query.status) filter.status = req.query.status;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('customerId', 'name email')
      .populate('vendorId', 'businessName category')
      .populate('venueId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  res.json({ success: true, data: { reviews, total, page, pages: Math.ceil(total / limit) || 1 } });
});

export const moderateReview = asyncHandler(async (req: AuthRequest, res) => {
  const { action } = req.body as { action: 'approve' | 'hide' | 'delete' };
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');

  if (action === 'delete') {
    await review.deleteOne();
  } else {
    review.status = action === 'hide' ? 'hidden' : 'visible';
    await review.save();
  }

  if (review.vendorId) {
    const stats = await Review.aggregate([
      { $match: { vendorId: review.vendorId, status: 'visible' } },
      { $group: { _id: '$vendorId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    await Vendor.findByIdAndUpdate(review.vendorId, {
      rating: stats.length ? Math.round(stats[0].avgRating * 10) / 10 : 0,
      reviewCount: stats.length ? stats[0].count : 0,
    });
  }
  if (review.venueId) {
    const stats = await Review.aggregate([
      { $match: { venueId: review.venueId, status: 'visible' } },
      { $group: { _id: '$venueId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    await Venue.findByIdAndUpdate(review.venueId, {
      rating: stats.length ? Math.round(stats[0].avgRating * 10) / 10 : 0,
      reviewCount: stats.length ? stats[0].count : 0,
    });
  }

  res.json({ success: true, message: action === 'delete' ? 'Review deleted' : `Review ${action === 'hide' ? 'hidden' : 'approved'}` });
});

// ---- Events overview ----
export const getAdminEvents = asyncHandler(async (req: AuthRequest, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 15);
  const filter: Record<string, unknown> = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(String(req.query.search)), 'i');
    filter.$or = [{ name: rx }, { location: rx }];
  }

  const [events, total] = await Promise.all([
    Event.find(filter).populate('userId', 'name email').sort({ date: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Event.countDocuments(filter),
  ]);

  res.json({ success: true, data: { events, total, page, pages: Math.ceil(total / limit) || 1 } });
});
