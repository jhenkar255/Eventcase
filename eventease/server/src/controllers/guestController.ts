import { Guest } from '../models/Guest';
import { Event } from '../models/Event';
import { asyncHandler } from '../utils/errorHandler';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../middleware/auth';
import { sendNotification } from '../services/notificationService';

const parseId = (id: string) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) throw ApiError.badRequest('Invalid identifier');
  return id;
};

export const requireEventOwnership = async (eventId: string, userId: string, role: string) => {
  const event = await Event.findById(parseId(eventId));
  if (!event) throw ApiError.notFound('Event not found');
  if (String(event.userId) !== userId && role !== 'admin') {
    throw ApiError.forbidden('You can only manage your own events');
  }
  return event;
};

export const getGuests = asyncHandler(async (req: AuthRequest, res) => {
  const event = await requireEventOwnership(parseId(req.params.eventId), req.user!.id, req.user!.role);

  const filter: Record<string, unknown> = { eventId: event._id };
  if (req.query.rsvpStatus) filter.rsvpStatus = req.query.rsvpStatus;
  if (req.query.search) {
    const rx = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const guests = await Guest.find(filter).sort({ createdAt: -1 }).lean();

  res.json({
    success: true,
    data: {
      guests,
      stats: {
        totalGuests: guests.length,
        totalPeople: guests.reduce((s, g) => s + g.guestCount, 0),
        confirmed: guests.filter((g) => g.rsvpStatus === 'confirmed').reduce((s, g) => s + g.guestCount, 0),
        pending: guests.filter((g) => g.rsvpStatus === 'pending').reduce((s, g) => s + g.guestCount, 0),
        declined: guests.filter((g) => g.rsvpStatus === 'declined').reduce((s, g) => s + g.guestCount, 0),
      },
    },
  });
});

export const createGuest = asyncHandler(async (req: AuthRequest, res) => {
  await requireEventOwnership(parseId(req.params.eventId), req.user!.id, req.user!.role);
  const guest = await Guest.create({ ...req.body, eventId: req.params.eventId });
  res.status(201).json({ success: true, message: 'Guest added', data: { guest } });
});

export const updateGuest = asyncHandler(async (req: AuthRequest, res) => {
  const guest = await Guest.findById(parseId(req.params.id));
  if (!guest) throw ApiError.notFound('Guest not found');
  await requireEventOwnership(String(guest.eventId), req.user!.id, req.user!.role);

  Object.assign(guest, req.body);
  await guest.save();
  res.json({ success: true, message: 'Guest updated', data: { guest } });
});

/**
 * Simulates sending an invitation. In production this would call an email
 * provider (SendGrid/SES). The abstraction is isolated here so a real provider
 * can be swapped in without touching the rest of the code.
 */
export const sendInvitation = asyncHandler(async (req: AuthRequest, res) => {
  const guest = await Guest.findById(parseId(req.params.id));
  if (!guest) throw ApiError.notFound('Guest not found');
  await requireEventOwnership(String(guest.eventId), req.user!.id, req.user!.role);

  const event = await Event.findById(guest.eventId);
  console.log(`[DEV] Invitation sent to ${guest.email || guest.phone || guest.name} for ${event?.name}`);

  res.json({ success: true, message: `Invitation sent to ${guest.name}` });
});

export const deleteGuest = asyncHandler(async (req: AuthRequest, res) => {
  const guest = await Guest.findById(parseId(req.params.id));
  if (!guest) throw ApiError.notFound('Guest not found');
  await requireEventOwnership(String(guest.eventId), req.user!.id, req.user!.role);

  await guest.deleteOne();
  res.json({ success: true, message: 'Guest removed' });
});
