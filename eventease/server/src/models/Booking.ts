import mongoose, { Schema, Document } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface IBooking extends Document {
  customerId: mongoose.Types.ObjectId;
  eventId?: mongoose.Types.ObjectId;
  vendorId?: mongoose.Types.ObjectId;
  venueId?: mongoose.Types.ObjectId;
  serviceId?: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  guestCount?: number;
  amount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
    venueId: { type: Schema.Types.ObjectId, ref: 'Venue', index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
    date: { type: Date, required: [true, 'Booking date is required'], index: true },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    guestCount: { type: Number, min: [0, 'Guest count cannot be negative'] },
    amount: { type: Number, required: [true, 'Amount is required'], min: [0, 'Amount cannot be negative'] },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
      index: true,
    },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

bookingSchema.index({ vendorId: 1, date: 1 });
bookingSchema.index({ venueId: 1, date: 1 });

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
