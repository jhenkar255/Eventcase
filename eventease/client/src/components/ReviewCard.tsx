import { Review, Vendor, Venue } from '../types';
import { RatingStars } from './ui';
import { formatDate } from '../utils/format';

const getName = (c: unknown): string => {
  if (typeof c === 'string') return 'Customer';
  if (c && typeof c === 'object' && 'name' in c) return (c as { name: string }).name || 'Customer';
  return 'Customer';
};

export const ReviewCard = ({
  review,
  showTarget,
  children,
}: {
  review: Review;
  showTarget?: boolean;
  children?: React.ReactNode;
}) => {
  const targetName =
    showTarget && review.vendorId && typeof review.vendorId === 'object'
      ? review.vendorId.businessName
      : showTarget && review.venueId && typeof review.venueId === 'object'
        ? review.venueId.name
        : null;

  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-700">
            {getName(review.customerId).charAt(0)}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{getName(review.customerId)}</p>
            <p className="text-xs text-slate-400">
              {formatDate(review.createdAt)} {targetName ? `· on ${targetName}` : ''}
            </p>
          </div>
        </div>
        <RatingStars rating={review.rating} size={14} />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{review.comment}</p>
      {review.response ? (
        <div className="mt-3 rounded-lg bg-slate-50 p-3 pl-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Response</p>
          <p className="mt-1 text-sm text-slate-600">{review.response}</p>
        </div>
      ) : null}
      {children}
    </div>
  );
};
