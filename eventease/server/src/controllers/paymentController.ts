import { Payment } from '../models/Payment';
import { Booking } from '../models/Booking';
import { asyncHandler } from '../utils/errorHandler';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../middleware/auth';
import { sendNotification } from '../services/notificationService';
import { generateTransactionId } from '../utils/jwt';

/**
 * Payment gateway abstraction.
 * Swap `processCharge` with Stripe/Razorpay when credentials are configured;
 * nothing else in the codebase needs to change.
 */
const paymentGateway = {
  name: 'EventEaseDemoPay',
  processCharge: async (amount: number, method: string): Promise<{ success: boolean; transactionId: string }> => {
    // Simulate processing latency + deterministic success for demo purposes
    await new Promise((r) => setTimeout(r, 400));
    if (amount <= 0) return { success: false, transactionId: '' };
    return { success: true, transactionId: generateTransactionId() };
  },
  refund: async (transactionId: string): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 200));
    return true;
  },
};

export const createPayment = asyncHandler(async (req: AuthRequest, res) => {
  const { bookingId, paymentMethod } = req.body as { bookingId: string; paymentMethod: string };

  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (String(booking.customerId) !== req.user!.id) {
    throw ApiError.forbidden('You can only pay for your own bookings');
  }
  if (booking.paymentStatus === 'paid') throw ApiError.conflict('This booking has already been paid');
  if (booking.status !== 'confirmed') {
    throw ApiError.badRequest('Only confirmed bookings can be paid for. Wait for vendor approval.');
  }

  const result = await paymentGateway.processCharge(booking.amount, paymentMethod);

  const payment = await Payment.create({
    bookingId: booking._id,
    customerId: req.user!.id,
    amount: booking.amount,
    paymentMethod,
    transactionId: result.transactionId || `FAILED-${Date.now()}`,
    status: result.success ? 'successful' : 'failed',
  });

  if (result.success) {
    booking.paymentStatus = 'paid';
    await booking.save();

    await sendNotification(req.user!.id, 'Payment successful', `Payment of ₹${booking.amount.toLocaleString('en-IN')} was received.`, 'payment', `/payments/${payment._id}`);

    if (booking.vendorId) {
      const Vendor = (await import('../models/Vendor')).Vendor;
      const vendor = await Vendor.findById(booking.vendorId);
      if (vendor) {
        await sendNotification(String(vendor.userId), 'Payment received', `You received ₹${booking.amount.toLocaleString('en-IN')} for a confirmed booking.`, 'payment', '/vendor/bookings');
      }
    }
  }

  res.status(result.success ? 201 : 402).json({
    success: result.success,
    message: result.success ? 'Payment successful' : 'Payment failed',
    data: { payment },
  });
});

export const getMyPayments = asyncHandler(async (req: AuthRequest, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);

  const filter: Record<string, unknown> =
    req.user!.role === 'admin' ? {} : { customerId: req.user!.id };

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate({ path: 'bookingId', populate: [{ path: 'vendorId', select: 'businessName' }, { path: 'venueId', select: 'name' }] })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Payment.countDocuments(filter),
  ]);

  res.json({ success: true, data: { payments, total, page, pages: Math.ceil(total / limit) || 1 } });
});

export const getPayment = asyncHandler(async (req: AuthRequest, res) => {
  const payment = await Payment.findById(req.params.id).populate({
    path: 'bookingId',
    populate: [
      { path: 'customerId', select: 'name email phone' },
      { path: 'eventId', select: 'name type location date' },
      { path: 'vendorId', select: 'businessName category location phone email' },
      { path: 'venueId', select: 'name location address price' },
      { path: 'serviceId', select: 'name pricingType price' },
    ],
  });

  if (!payment) throw ApiError.notFound('Payment not found');
  if (String(payment.customerId) !== req.user!.id && req.user!.role !== 'admin') {
    throw ApiError.forbidden('Access denied');
  }

  res.json({ success: true, data: { payment, gateway: paymentGateway.name } });
});
