import mongoose, { Schema, Document } from 'mongoose';

export type VendorCategory =
  | 'Catering' | 'Photography' | 'Videography' | 'Decoration' | 'DJ' | 'Music'
  | 'Makeup Artist' | 'Florist' | 'Wedding Planner' | 'Security' | 'Transportation'
  | 'Invitation Designer' | 'Event Equipment' | 'Other';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type VendorStatus = 'active' | 'suspended';

export const VENDOR_CATEGORIES: VendorCategory[] = [
  'Catering', 'Photography', 'Videography', 'Decoration', 'DJ', 'Music',
  'Makeup Artist', 'Florist', 'Wedding Planner', 'Security', 'Transportation',
  'Invitation Designer', 'Event Equipment', 'Other',
];

export interface IVendor extends Document {
  userId: mongoose.Types.ObjectId;
  businessName: string;
  category: VendorCategory;
  description?: string;
  location: string;
  phone: string;
  email: string;
  profileImage?: string;
  portfolio: string[];
  startingPrice: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  verificationStatus: VerificationStatus;
  status: VendorStatus;
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    businessName: { type: String, required: [true, 'Business name is required'], trim: true, maxlength: 150 },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: { values: VENDOR_CATEGORIES, message: '{VALUE} is not a valid vendor category' },
      index: true,
    },
    description: { type: String, trim: true, maxlength: 3000 },
    location: { type: String, required: [true, 'Location is required'], trim: true, index: true },
    phone: { type: String, required: [true, 'Phone is required'], trim: true },
    email: { type: String, lowercase: true, trim: true },
    profileImage: { type: String, default: '' },
    portfolio: { type: [String], default: [] },
    startingPrice: { type: Number, default: 0, min: [0, 'Starting price cannot be negative'], index: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  },
  { timestamps: true }
);

export const Vendor = mongoose.model<IVendor>('Vendor', vendorSchema);
