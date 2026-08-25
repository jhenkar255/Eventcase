import mongoose, { Schema, Document } from 'mongoose';

export type ReviewStatus = 'visible' | 'hidden' | 'reported';
export type ReviewTarget = 'vendor' | 'venue';

export interface IReview extends Document {
  customerId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  vendorId?: mongoose.Types.ObjectId;
  venueId?: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  images: string[];
  response?: string;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
    venueId: { type: Schema.Types.ObjectId, ref: 'Venue', index: true },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      minlength: [10, 'Comment must be at least 10 characters'],
      maxlength: 2000,
    },
    images: { type: [String], default: [] },
    response: { type: String, default: '', maxlength: 1000 },
    status: { type: String, enum: ['visible', 'hidden', 'reported'], default: 'visible', index: true },
  },
  { timestamps: true }
);

reviewSchema.index({ bookingId: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  const query = this as unknown as mongoose.Query<unknown, unknown>;
  const filter = query.getFilter();
  if (!('status' in filter)) {
    query.where({ status: { $ne: 'hidden' } });
  }
  next();
});

export const Review = mongoose.model<IReview>('Review', reviewSchema);
