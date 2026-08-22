import { Review } from '../models/Review';
import { Booking } from '../models/Booking';
import { Vendor } from '../models/Vendor';
import { Venue } from '../models/Venue';
import { asyncHandler } from '../utils/errorHandler';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../middleware/auth';
import { sendNotification } from '../services/notificationService';

const recalcVendorRating = async (vendorId: string) => {
  const stats = await Review.aggregate([
    { $match: { vendorId: new (require('mongoose').Types.ObjectId)(vendorId), status: 'visible' } },
    { $group: { _id: '$vendorId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const vendor = await Vendor.findById(vendorId);
  if (vendor) {
    vendor.rating = stats.length ? Math.round(stats[0].avgRating * 10) / 10 : 0;
    vendor.reviewCount = stats.length ? stats[0].count : 0;
    await vendor.save();
  }
};

const recalcVenueRating = async (venueId: string) => {
  const stats = await Review.aggregate([
    { $match: { venueId: new (require('mongoose').Types.ObjectId)(venueId), status: 'visible' } },
    { $group: { _id: '$venueId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const venue = await Venue.findById(venueId);
  if (venue) {
    venue.rating = stats.length ? Math.round(stats[0].avgRating * 10) / 10 : 0;
    venue.reviewCount = stats.length ? stats[0].count : 0;
    await venue.save();
  }
};

export const getReviews = asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};

  if (!req.user || req.user.role === 'guest') {
    // public listing only shows visible reviews
    filter.status = 'visible';
  }

  if (req.query.vendorId && /^[0-9a-fA-F]{24}$/.test(String(req.query.vendorId))) filter.vendorId = req.query.vendorId;
  if (req.query.venueId && /^[0-9a-fA-F]{24}$/.test(String(req.query.venueId))) filter.venueId = req.query.venueId;

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('customerId', 'name profileImage')
      .populate('vendorId', 'businessName category profileImage')
      .populate('venueId', 'name images location')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  res.json({
    success: true,
    data: {
      reviews,
      distribution,
      averageRating: reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

export const createReview = asyncHandler(async (req: AuthRequest, res) => {
  const { bookingId, rating, comment, images } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (String(booking.customerId) !== req.user!.id) {
    throw ApiError.forbidden('You can only review your own bookings');
  }
  if (booking.status !== 'completed') {
    throw ApiError.badRequest('You can only review bookings that have been completed');
  }

  const existing = await Review.findOne({ bookingId });
  if (existing) {
    throw ApiError.conflict('You have already reviewed this booking');
  }

  const review = await Review.create({
    customerId: req.user!.id,
    bookingId,
    vendorId: booking.vendorId,
    venueId: booking.venueId,
    rating,
    comment,
    images: images || [],
  });

  if (booking.vendorId) await recalcVendorRating(String(booking.vendorId));
  if (booking.venueId) await recalcVenueRating(String(booking.venueId));

  if (booking.vendorId) {
    const vendor = await Vendor.findById(booking.vendorId);
    if (vendor) {
      await sendNotification(String(vendor.userId), 'New review received', `${'★'.repeat(rating)} — you received a new ${rating}-star review.`, 'review', '/vendor/reviews');
    }
  }

  const populated = await Review.findById(review._id).populate('vendorId', 'businessName').populate('venueId', 'name');

  res.status(201).json({ success: true, message: 'Review submitted. Thank you!', data: { review: populated } });
});

export const updateReview = asyncHandler(async (req: AuthRequest, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  if (String(review.customerId) !== req.user!.id) {
    throw ApiError.forbidden('You can only edit your own reviews');
  }

  Object.assign(review, req.body);
  await review.save();

  if (review.vendorId) await recalcVendorRating(String(review.vendorId));
  if (review.venueId) await recalcVenueRating(String(review.venueId));

  res.json({ success: true, message: 'Review updated', data: { review } });
});

export const deleteReview = asyncHandler(async (req: AuthRequest, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');

  const isOwner = String(review.customerId) === req.user!.id;
  const isAdmin = req.user!.role === 'admin';
  if (!isOwner && !isAdmin) throw ApiError.forbidden('You can only delete your own reviews');

  await review.deleteOne();

  if (review.vendorId) await recalcVendorRating(String(review.vendorId));
  if (review.venueId) await recalcVenueRating(String(review.venueId));

  res.json({ success: true, message: 'Review deleted' });
});

export const getMyReviews = asyncHandler(async (req: AuthRequest, res) => {
  const reviews = await Review.find({ customerId: req.user!.id })
    .populate('vendorId', 'businessName category profileImage')
    .populate('venueId', 'name images location')
    .populate({ path: 'bookingId', select: 'date amount serviceId eventId', populate: { path: 'serviceId', select: 'name' } })
    .sort({ createdAt: -1 });

  res.json({ success: true, data: { reviews } });
});
