import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType =
  | 'booking-request' | 'booking-accepted' | 'booking-rejected' | 'booking-cancelled'
  | 'booking-completed' | 'payment' | 'event-reminder' | 'review'
  | 'review-response' | 'rsvp' | 'account' | 'system';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'system', index: true },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
