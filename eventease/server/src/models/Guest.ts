import mongoose, { Schema, Document } from 'mongoose';

export type RSVPStatus = 'pending' | 'confirmed' | 'declined';

export interface IGuest extends Document {
  eventId: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  guestCount: number;
  rsvpStatus: RSVPStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const guestSchema = new Schema<IGuest>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    name: { type: String, required: [true, 'Guest name is required'], trim: true, maxlength: 100 },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    guestCount: { type: Number, default: 1, min: [1, 'Guest count must be at least 1'] },
    rsvpStatus: { type: String, enum: ['pending', 'confirmed', 'declined'], default: 'pending', index: true },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

export const Guest = mongoose.model<IGuest>('Guest', guestSchema);
