import { Booking } from '../models/Booking';
import { Vendor } from '../models/Vendor';
import { Venue } from '../models/Venue';
import { Service } from '../models/Service';
import { Event } from '../models/Event';
import { Review } from '../models/Review';
import { asyncHandler } from '../utils/errorHandler';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../middleware/auth';
import { sendNotification } from '../services/notificationService';
import { Types } from 'mongoose';

const parseId = (id: string) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) throw ApiError.badRequest('Invalid identifier');
  return id;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(bStart) < timeToMinutes(aEnd);

/**
 * Checks that the target vendor/venue is not already booked at the requested
 * date/time by an active booking (pending/confirmed/completed).
 */
export const checkAvailability = async (
  kind: 'vendor' | 'venue',
  targetId: string,
  date: Date,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
): Promise<boolean> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const filter: Record<string, unknown> = {
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['pending', 'confirmed', 'completed'] },
  };
  filter[kind === 'vendor' ? 'vendorId' : 'venueId'] = new Types.ObjectId(targetId);
  if (excludeBookingId) filter._id = { $ne: new Types.ObjectId(excludeBookingId) };

  const conflicts = await Booking.find(filter).lean();
  return !conflicts.some((b) => overlaps(startTime, endTime, b.startTime, b.endTime));
};

export const getBookings = asyncHandler(async (req: AuthRequest, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);

  let filter: Record<string, unknown>;
  if (req.user!.role === 'admin') {
    filter = {};
  } else if (req.user!.role === 'vendor') {
    const vendor = await Vendor.findOne({ userId: req.user!.id });
    if (!vendor) throw ApiError.notFound('Vendor profile not found');
    filter = { vendorId: vendor._id };
  } else {
    filter = { customerId: req.user!.id };
  }

  if (req.query.status) filter.status = req.query.status;

  const populate = [
    { path: 'customerId', select: 'name email phone profileImage' },
    { path: 'eventId', select: 'name type location' },
    {
      path: 'vendorId',
      select: 'businessName category profileImage userId',
      populate: { path: 'userId', select: 'name email' },
    },
    { path: 'venueId', select: 'name location images' },
    { path: 'serviceId', select: 'name pricingType price' },
  ];

  const [bookings, total] = await Promise.all([
    Booking.find(filter).populate(populate).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Booking.countDocuments(filter),
  ]);

  res.json({ success: true, data: { bookings, total, page, pages: Math.ceil(total / limit) || 1 } });
});

export const getBooking = asyncHandler(async (req: AuthRequest, res) => {
  const booking = await Booking.findById(parseId(req.params.id))
    .populate('customerId', 'name email phone profileImage')
    .populate('eventId', 'name type location')
    .populate({ path: 'vendorId', populate: { path: 'userId', select: 'name email phone' } })
    .populate('venueId', 'name location images address')
    .populate('serviceId');

  if (!booking) throw ApiError.notFound('Booking not found');

  const isOwner = String(booking.customerId._id ?? booking.customerId) === req.user!.id;
  let isVendor = false;
  if (booking.vendorId && typeof booking.vendorId === 'object' && 'userId' in booking.vendorId) {
    const vUserId = (booking.vendorId as unknown as { userId: { _id?: unknown; toString(): string } | string }).userId;
    isVendor = String(vUserId && typeof vUserId === 'object' && '_id' in vUserId ? vUserId._id : vUserId) === req.user!.id;
  }

  if (!isOwner && !isVendor && req.user!.role !== 'admin') {
    throw ApiError.forbidden('You do not have access to this booking');
  }

  const review = await Review.findOne({ bookingId: booking._id });

  res.json({ success: true, data: { booking, review: review || null } });
});

export const createBooking = asyncHandler(async (req: AuthRequest, res) => {
  const { eventId, vendorId, venueId, serviceId, date, startTime, endTime, guestCount, notes } = req.body;

  if (!vendorId && !venueId) {
    throw ApiError.badRequest('A vendor or venue must be specified for the booking');
  }

  // Validate event ownership
  if (eventId) {
    const event = await Event.findById(parseId(eventId));
    if (!event) throw ApiError.notFound('Event not found');
    if (String(event.userId) !== req.user!.id) throw ApiError.forbidden('You can only book against your own events');
    if (new Date(event.date).getTime() !== new Date(date).setHours(12, 0, 0, 0) + new Date(event.date).getTimezoneOffset() * 60000 * -1) {
      // dates may differ in timezone storage; allow but warn-free
    }
  }

  let amount = 0;
  let finalVendorId: string | undefined;
  let finalVenueId: string | undefined;
  let finalServiceId: string | undefined;

  if (vendorId) {
    const vendor = await Vendor.findById(parseId(vendorId));
    if (!vendor || vendor.verificationStatus !== 'approved' || vendor.status !== 'active') {
      throw ApiError.notFound('Vendor not available');
    }
    finalVendorId = String(vendor._id);

    if (serviceId) {
      const service = await Service.findById(parseId(serviceId));
      if (!service || String(service.vendorId) !== String(vendor._id)) {
        throw ApiError.notFound('Service not found for this vendor');
      }
      finalServiceId = String(service._id);

      switch (service.pricingType) {
        case 'Per Person':
          amount = service.price * Math.max(1, guestCount || 1);
          break;
        case 'Per Hour': {
          const hours = Math.max(1, (timeToMinutes(endTime) - timeToMinutes(startTime)) / 60);
          amount = service.price * hours;
          break;
        }
        case 'Custom Quote':
          amount = service.price > 0 ? service.price : vendor.startingPrice || 5000;
          break;
        default:
          amount = service.price;
      }
    } else {
      amount = vendor.startingPrice || 5000;
    }

    const available = await checkAvailability('vendor', finalVendorId, new Date(date), startTime, endTime);
    if (!available) {
      throw ApiError.conflict(
        `${vendor.businessName} already has a booking between ${startTime} and ${endTime} on this date. Please choose a different time slot.`
      );
    }
  }

  if (venueId) {
    const venue = await Venue.findById(parseId(venueId));
    if (!venue || venue.status !== 'active' || venue.verificationStatus !== 'approved') {
      throw ApiError.notFound('Venue not available');
    }
    finalVenueId = String(venue._id);
    amount = venue.price;

    const available = await checkAvailability('venue', finalVenueId, new Date(date), startTime, endTime);
    if (!available) {
      throw ApiError.conflict(`${venue.name} is already booked between ${startTime} and ${endTime} on this date. Try another slot.`);
    }
  }

  const booking = await Booking.create({
    customerId: req.user!.id,
    eventId: eventId || undefined,
    vendorId: finalVendorId,
    venueId: finalVenueId,
    serviceId: finalServiceId,
    date,
    startTime,
    endTime,
    guestCount,
    amount,
    notes,
    status: 'pending',
    paymentStatus: 'unpaid',
  });

  // Notify the vendor
  if (finalVendorId) {
    const vendor = await Vendor.findById(finalVendorId);
    if (vendor) {
      await sendNotification(
        String(vendor.userId),
        'New booking request',
        `You have a new booking request for ${new Date(date).toDateString()} (${startTime}-${endTime}).`,
        'booking-request',
        '/vendor/bookings'
      );
    }
  }

  res.status(201).json({ success: true, message: 'Booking request sent', data: { booking } });
});

export const updateBookingStatus = asyncHandler(async (req: AuthRequest, res) => {
  const booking = await Booking.findById(parseId(req.params.id));
  if (!booking) throw ApiError.notFound('Booking not found');

  const { status } = req.body as { status: string };
  const isCustomer = String(booking.customerId) === req.user!.id;
  const isAdmin = req.user!.role === 'admin';

  let isVendor = false;
  if (booking.vendorId) {
    const vendor = await Vendor.findById(booking.vendorId);
    isVendor = !!vendor && String(vendor.userId) === req.user!.id;
  }

  if (!isCustomer && !isVendor && !isAdmin) {
    throw ApiError.forbidden('You cannot modify this booking');
  }

  // Permission rules
  if (isVendor && !isAdmin) {
    const allowedForVendor = ['confirmed', 'rejected', 'completed'];
    if (!allowedForVendor.includes(status)) {
      throw ApiError.forbidden(`Vendors can only set status to: ${allowedForVendor.join(', ')}`);
    }
    if (status === 'completed' && booking.paymentStatus !== 'paid') {
      throw ApiError.badRequest('Booking must be paid before it can be marked completed');
    }
  }

  if (isCustomer && !isVendor && !isAdmin) {
    if (status !== 'cancelled') {
      throw ApiError.forbidden('Customers can only cancel bookings');
    }
    if (['rejected', 'cancelled', 'completed'].includes(booking.status)) {
      throw ApiError.badRequest(`Cannot cancel a ${booking.status} booking`);
    }
  }

  const previousStatus = booking.status;
  booking.status = status as never;

  if (status === 'cancelled' && previousStatus === 'confirmed' && booking.paymentStatus === 'paid') {
    booking.paymentStatus = 'refunded';
  }
  if (status === 'completed') {
    booking.paymentStatus = booking.paymentStatus === 'paid' ? 'paid' : 'paid';
  }

  await booking.save();

  const populated = await Booking.findById(booking._id)
    .populate('customerId', 'name')
    .populate({ path: 'vendorId', select: 'businessName userId' })
    .populate('venueId', 'name');

  // Notifications
  if (status === 'confirmed') {
    await sendNotification(String(booking.customerId), 'Booking confirmed', 'Your booking has been accepted. Complete payment to finalize.', 'booking-accepted', '/bookings');
  } else if (status === 'rejected') {
    await sendNotification(String(booking.customerId), 'Booking rejected', 'Unfortunately your booking was rejected.', 'booking-rejected', '/bookings');
  } else if (status === 'cancelled') {
    if (isVendor || isAdmin) {
      const vid = booking.vendorId ? await Vendor.findById(booking.vendorId) : null;
      if (vid) await sendNotification(String(vid.userId), 'Booking cancelled', 'A customer cancelled their booking.', 'booking-cancelled', '/vendor/bookings');
    } else if (populated?.vendorId) {
      const vid = await Vendor.findById(populated.vendorId);
      if (vid) await sendNotification(String(vid.userId), 'Booking cancelled', 'The customer cancelled their booking.', 'booking-cancelled', '/vendor/bookings');
    }
  } else if (status === 'completed') {
    await sendNotification(String(booking.customerId), 'Event completed', 'Thanks for using EventEase! You can now leave a review for this booking.', 'booking-completed', '/bookings');
  }

  res.json({ success: true, message: `Booking ${status}`, data: { booking: populated } });
});

export const cancelBooking = asyncHandler(async (req: AuthRequest, res) => {
  req.body.status = 'cancelled';
  return updateBookingStatus(req as never, res, () => Promise.resolve());
});
