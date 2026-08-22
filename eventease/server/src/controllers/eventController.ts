import { Event } from '../models/Event';
import { Guest } from '../models/Guest';
import { Task } from '../models/Task';
import { Expense } from '../models/Expense';
import { Booking } from '../models/Booking';
import { asyncHandler, notFoundHandler as nf } from '../utils/errorHandler';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../middleware/auth';

const parseId = (id: string) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) throw ApiError.badRequest('Invalid identifier');
  return id;
};

export const getEvents = asyncHandler(async (req: AuthRequest, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 12);
  const filter: Record<string, unknown> = { userId: req.user!.id };

  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const rx = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { location: rx }, { description: rx }];
  }

  const [events, total] = await Promise.all([
    Event.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Event.countDocuments(filter),
  ]);

  res.json({ success: true, data: { events, total, page, pages: Math.ceil(total / limit) || 1 } });
});

export const getEvent = asyncHandler(async (req: AuthRequest, res) => {
  const event = await Event.findById(parseId(req.params.id));
  if (!event) throw nf('Event not found');
  if (String(event.userId) !== req.user!.id && req.user!.role !== 'admin') {
    throw ApiError.forbidden('You can only view your own events');
  }

  const [guests, tasks, expenses, bookings] = await Promise.all([
    Guest.find({ eventId: event._id }).sort({ createdAt: -1 }).lean(),
    Task.find({ eventId: event._id }).sort({ date: 1, startTime: 1 }).lean(),
    Expense.find({ eventId: event._id }).sort({ date: -1 }).lean(),
    Booking.find({ eventId: event._id })
      .populate('vendorId', 'businessName category profileImage')
      .populate('venueId', 'name location images')
      .populate('serviceId', 'name pricingType')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  res.json({
    success: true,
    data: {
      event,
      guests,
      tasks,
      expenses,
      bookings,
      summary: {
        spent: expenses.reduce((sum, e) => sum + e.amount, 0),
        budgetUsed: event.budget > 0 ? Math.round((expenses.reduce((s, e) => s + e.amount, 0) / event.budget) * 100) : 0,
        guestCounts: {
          total: guests.reduce((s, g) => s + g.guestCount, 0),
          confirmed: guests.filter((g) => g.rsvpStatus === 'confirmed').reduce((s, g) => s + g.guestCount, 0),
          pending: guests.filter((g) => g.rsvpStatus === 'pending').reduce((s, g) => s + g.guestCount, 0),
          declined: guests.filter((g) => g.rsvpStatus === 'declined').reduce((s, g) => s + g.guestCount, 0),
        },
        pendingTasks: tasks.filter((t) => t.status !== 'completed').length,
      },
    },
  });
});

export const createEvent = asyncHandler(async (req: AuthRequest, res) => {
  const event = await Event.create({ ...req.body, userId: req.user!.id });
  res.status(201).json({ success: true, message: 'Event created successfully', data: { event } });
});

export const updateEvent = asyncHandler(async (req: AuthRequest, res) => {
  const event = await Event.findById(parseId(req.params.id));
  if (!event) throw nf('Event not found');
  if (String(event.userId) !== req.user!.id && req.user!.role !== 'admin') {
    throw ApiError.forbidden('You can only modify your own events');
  }

  Object.assign(event, req.body);
  await event.save();

  res.json({ success: true, message: 'Event updated successfully', data: { event } });
});

export const deleteEvent = asyncHandler(async (req: AuthRequest, res) => {
  const event = await Event.findById(parseId(req.params.id));
  if (!event) throw nf('Event not found');
  if (String(event.userId) !== req.user!.id && req.user!.role !== 'admin') {
    throw ApiError.forbidden('You can only delete your own events');
  }

  await Promise.all([
    event.deleteOne(),
    Guest.deleteMany({ eventId: event._id }),
    Task.deleteMany({ eventId: event._id }),
    Expense.deleteMany({ eventId: event._id }),
  ]);

  // Cancel any active bookings tied to this event
  await Booking.updateMany(
    { eventId: event._id, status: { $in: ['pending', 'confirmed'] } },
    { status: 'cancelled' }
  );

  res.json({ success: true, message: 'Event deleted successfully' });
});
