import mongoose, { Schema, Document } from 'mongoose';

export type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet';
export type PaymentStatus = 'pending' | 'successful' | 'failed' | 'refunded';

export interface IPayment extends Document {
  bookingId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: [true, 'Amount is required'], min: [0.01, 'Amount must be greater than zero'] },
    paymentMethod: { type: String, enum: ['card', 'upi', 'netbanking', 'wallet'], default: 'card' },
    transactionId: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'successful', 'failed', 'refunded'], default: 'pending', index: true },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
