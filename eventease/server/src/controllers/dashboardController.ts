import { Event } from '../models/Event';
import { Booking } from '../models/Booking';
import { Expense } from '../models/Expense';
import { Task } from '../models/Task';
import { Guest } from '../models/Guest';
import { Notification } from '../models/Notification';
import { asyncHandler } from '../utils/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getDashboard = asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const [events, bookings, notifications] = await Promise.all([
    Event.find({ userId }).sort({ date: -1 }).lean(),
    Booking.find({ customerId: userId })
      .populate('eventId', 'name type')
      .populate({ path: 'vendorId', select: 'businessName category profileImage' })
      .populate('venueId', 'name location images')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    Notification.find({ userId }).sort({ createdAt: -1 }).limit(6).lean(),
  ]);

  const eventIds = events.map((e) => e._id);
  const [expenses, tasks, guests] = await Promise.all([
    Expense.find({ eventId: { $in: eventIds } }).lean(),
    Task.find({ eventId: { $in: eventIds }, status: { $ne: 'completed' } })
      .populate('eventId', 'name')
      .sort({ date: 1 })
      .limit(8)
      .lean(),
    Guest.find({ eventId: { $in: eventIds } }).lean(),
  ]);

  const now = new Date();
  const totalBudget = events.reduce((s, e) => s + e.budget, 0);
  const spent = expenses.reduce((s, e) => s + e.amount, 0);
  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= now && e.status !== 'cancelled' && e.status !== 'completed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const rsvpStats = {
    confirmed: guests.filter((g) => g.rsvpStatus === 'confirmed').reduce((s, g) => s + g.guestCount, 0),
    pending: guests.filter((g) => g.rsvpStatus === 'pending').reduce((s, g) => s + g.guestCount, 0),
    declined: guests.filter((g) => g.rsvpStatus === 'declined').reduce((s, g) => s + g.guestCount, 0),
    invited: guests.reduce((s, g) => s + g.guestCount, 0),
  };

  res.json({
    success: true,
    data: {
      stats: {
        totalEvents: events.length,
        upcomingEvents: upcomingEvents.length,
        totalBookings: bookings.length,
        pendingBookings: bookings.filter((b) => b.status === 'pending').length,
        completedBookings: bookings.filter((b) => b.status === 'completed').length,
        totalBudget,
        amountSpent: spent,
        budgetUsedPct: totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0,
        pendingTasks: tasks.length,
      },
      upcomingEvents: upcomingEvents.slice(0, 4),
      recentBookings: bookings.slice(0, 5),
      pendingTasks,
      budgetSummary: buildBudgetSummary(events.slice(0, 5), expenses),
      rsvpStats,
      notifications,
    },
  });
});

const EXPENSE_CATEGORIES = ['Venue', 'Catering', 'Decoration', 'Photography', 'Music', 'Transportation', 'Invitation', 'Security', 'Miscellaneous'];

function buildBudgetSummary(events: Array<{ _id: unknown; name: string; budget: number }>, expenses: Array<{ eventId: unknown; amount: number; category: string }>) {
  return events.map((event) => {
    const eventExpenses = expenses.filter((e) => String(e.eventId) === String(event._id));
    const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
      category: cat,
      amount: eventExpenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
    })).filter((c) => c.amount > 0);

    const spentForEvent = eventExpenses.reduce((s, e) => s + e.amount, 0);
    return {
      eventId: event._id,
      name: event.name,
      budget: event.budget,
      spent: spentForEvent,
      remaining: event.budget - spentForEvent,
      pct: event.budget > 0 ? Math.min(100, Math.round((spentForEvent / event.budget) * 100)) : 0,
      byCategory,
    };
  });
}
