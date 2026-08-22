import mongoose, { Schema, Document } from 'mongoose';

export type EventType =
  | 'Wedding' | 'Birthday' | 'Corporate Event' | 'College Event' | 'Conference'
  | 'Concert' | 'Party' | 'Sports Event' | 'Cultural Event' | 'Other';

export type EventStatus = 'planning' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface IEvent extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: EventType;
  description?: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  guestCount: number;
  budget: number;
  image?: string;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const EVENT_TYPES: EventType[] = [
  'Wedding', 'Birthday', 'Corporate Event', 'College Event', 'Conference',
  'Concert', 'Party', 'Sports Event', 'Cultural Event', 'Other',
];

const eventSchema = new Schema<IEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Event name is required'], trim: true, maxlength: 150 },
    type: {
      type: String,
      required: [true, 'Event type is required'],
      enum: { values: EVENT_TYPES, message: '{VALUE} is not a valid event type' },
      index: true,
    },
    description: { type: String, trim: true, maxlength: 2000 },
    date: { type: Date, required: [true, 'Event date is required'], index: true },
    startTime: { type: String, required: [true, 'Start time is required'] },
    endTime: { type: String, required: [true, 'End time is required'] },
    location: { type: String, required: [true, 'Location is required'], trim: true, index: true },
    guestCount: { type: Number, required: [true, 'Guest count is required'], min: [1, 'Guest count must be at least 1'] },
    budget: { type: Number, required: [true, 'Budget is required'], min: [0, 'Budget cannot be negative'], default: 0 },
    image: { type: String, default: '' },
    status: { type: String, enum: ['planning', 'upcoming', 'ongoing', 'completed', 'cancelled'], default: 'planning', index: true },
  },
  { timestamps: true }
);

export const Event = mongoose.model<IEvent>('Event', eventSchema);
