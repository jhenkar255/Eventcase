import mongoose, { Schema, Document } from 'mongoose';
import { VENDOR_CATEGORIES } from './Vendor';

export type PricingType = 'Fixed' | 'Per Person' | 'Per Hour' | 'Custom Quote';

export interface IService extends Document {
  vendorId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  category: string;
  price: number;
  pricingType: PricingType;
  duration?: string;
  images: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    name: { type: String, required: [true, 'Service name is required'], trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 2000 },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: VENDOR_CATEGORIES,
    },
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'], index: true },
    pricingType: { type: String, enum: ['Fixed', 'Per Person', 'Per Hour', 'Custom Quote'], default: 'Fixed' },
    duration: { type: String, default: '' },
    images: { type: [String], default: [] },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true }
);

serviceSchema.index({ vendorId: 1, category: 1 });

export const Service = mongoose.model<IService>('Service', serviceSchema);
