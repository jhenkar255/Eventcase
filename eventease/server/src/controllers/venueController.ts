import { Venue } from '../models/Venue';
import { Review } from '../models/Review';
import { Booking } from '../models/Booking';
import { asyncHandler } from '../utils/errorHandler';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../middleware/auth';
import { Types } from 'mongoose';

const buildVenueFilter = (query: Record<string, unknown>): Record<string, unknown> => {
  const filter: Record<string, unknown> = { status: 'active', verificationStatus: 'approved' };

  if (query.location) {
    filter.location = new RegExp(String(query.location).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }
  if (query.search) {
    const rx = new RegExp(String(query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { location: rx }, { description: rx }];
  }
  if (query.capacity) {
    filter.capacity = { $gte: Number(query.capacity) };
  }
  if (query.minPrice || query.maxPrice) {
    const priceFilter: Record<string, number> = {};
    if (query.minPrice) priceFilter.$gte = Number(query.minPrice);
    if (query.maxPrice) priceFilter.$lte = Number(query.maxPrice);
    filter.price = priceFilter;
  }
  if (query.facilities) {
    const list = String(query.facilities).split(',').filter(Boolean);
    if (list.length) filter.facilities = { $all: list };
  }
  return filter;
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getVenues = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 12);
  const filter = buildVenueFilter(req.query as Record<string, unknown>);

  if (req.query.minRating) {
    filter.rating = { $gte: Number(req.query.minRating) };
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { rating: -1 },
    capacity: { capacity: -1 },
    newest: { createdAt: -1 },
  };
  const sort = sortMap[String(req.query.sort)] || { rating: -1 };

  const [venues, total] = await Promise.all([
    Venue.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Venue.countDocuments(filter),
  ]);

  res.json({ success: true, data: { venues, total, page, pages: Math.ceil(total / limit) || 1 } });
});

export const getVenue = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id);
  if (!venue) throw ApiError.notFound('Venue not found');

  let reviews;
  if (venue.verificationStatus === 'approved' && venue.status === 'active') {
    reviews = await Review.find({ venueId: venue._id })
      .populate('customerId', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
  }

  res.json({ success: true, data: { venue, reviews: reviews || [] } });
});

export const createVenue = asyncHandler(async (req: AuthRequest, res) => {
  const venue = await Venue.create({ ...req.body, verificationStatus: 'pending' });
  res.status(201).json({ success: true, message: 'Venue created and pending approval', data: { venue } });
});

export const updateVenue = asyncHandler(async (req: AuthRequest, res) => {
  const venue = await Venue.findById(req.params.id);
  if (!venue) throw ApiError.notFound('Venue not found');
  if (req.user!.role !== 'admin') throw ApiError.forbidden('Only admins can modify venues');

  Object.assign(venue, req.body);
  await venue.save();
  res.json({ success: true, message: 'Venue updated', data: { venue } });
});

export const deleteVenue = asyncHandler(async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') throw ApiError.forbidden('Only admins can delete venues');
  const venue = await Venue.findByIdAndDelete(req.params.id);
  if (!venue) throw ApiError.notFound('Venue not found');
  res.json({ success: true, message: 'Venue deleted' });
});

export const getVenueAvailability = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id);
  if (!venue) throw ApiError.notFound('Venue not found');

  // Booked dates for the next 6 months
  const start = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 6);

  const bookings = await Booking.find({
    venueId: new Types.ObjectId(String(venue._id)),
    date: { $gte: start, $lte: end },
    status: { $in: ['pending', 'confirmed', 'completed'] },
  }).select('date status').lean();

  res.json({
    success: true,
    data: {
      availability: Object.fromEntries(venue.availability instanceof Map ? venue.availability : []),
      bookedDates: bookings.map((b) => b.date),
    },
  });
});
