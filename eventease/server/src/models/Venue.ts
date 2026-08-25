import mongoose, { Schema, Document } from 'mongoose';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type VenueStatus = 'active' | 'suspended';

export interface IVenue extends Document {
  name: string;
  description?: string;
  location: string;
  address: string;
  capacity: number;
  price: number;
  facilities: string[];
  images: string[];
  rating: number;
  reviewCount: number;
  availability: Record<string, boolean>;
  status: VenueStatus;
  verificationStatus: VerificationStatus;
  ownerId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const VENUE_FACILITIES = [
  'Parking', 'AC', 'WiFi', 'Catering Allowed', 'In-house Catering',
  'Stage', 'Sound System', 'Projector', 'Green Rooms', 'Valet Parking',
  'Garden Area', 'Swimming Pool', 'Power Backup', 'Lift', 'Bar',
] as const;

const venueSchema = new Schema<IVenue>(
  {
    name: { type: String, required: [true, 'Venue name is required'], trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 3000 },
    location: { type: String, required: [true, 'Location is required'], trim: true, index: true },
    address: { type: String, trim: true },
    capacity: { type: Number, required: [true, 'Capacity is required'], min: [1, 'Capacity must be at least 1'], index: true },
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'], index: true },
    facilities: { type: [String], default: [] },
    images: { type: [String], default: [] },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    availability: {
      type: Map,
      of: Boolean,
      default: new Map(),
    },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

venueSchema.index({ location: 1, price: 1 });

export const Venue = mongoose.model<IVenue>('Venue', venueSchema);
