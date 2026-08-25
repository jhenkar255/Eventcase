import { Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

export const LoadingSpinner = ({ label = 'Loading…', full }: { label?: string; full?: boolean }) => (
  <div className={`flex flex-col items-center justify-center gap-3 py-12 ${full ? 'min-h-[50vh]' : ''}`} role="status" aria-live="polite">
    <Loader2 size={32} className="animate-spin text-primary-600" />
    <p className="text-sm font-medium text-slate-500">{label}</p>
  </div>
);

export const EmptyState = ({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  title: string;
  message?: string;
  action?: ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-14 text-center">
    {Icon && (
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
        <Icon size={26} className="text-primary-500" />
      </div>
    )}
    <h3 className="text-base font-bold text-slate-800">{title}</h3>
    {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const ErrorBanner = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
    <p className="text-sm font-medium text-red-700">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="text-xs font-bold uppercase tracking-wide text-red-600 hover:text-red-800">
        Retry
      </button>
    )}
  </div>
);

export const SuccessBanner = ({ message }: { message: string }) => (
  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3" role="status">
    <p className="text-sm font-medium text-emerald-700">{message}</p>
  </div>
);

interface PaginationProps {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}

export const Pagination = ({ page, pages, onChange }: PaginationProps) => {
  if (pages <= 1) return null;
  return (
    <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Pagination">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
      >
        Previous
      </button>
      {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
        let p = page;
        if (pages > 7) {
          if (page <= 4) p = i + 1 === 6 ? pages : i + 1;
          else if (page >= pages - 3) p = i === 0 ? 1 : pages - 6 + i + 1 - 1;
          else p = i === 0 ? 1 : i === 6 ? pages : page - 3 + (i - 1);
        } else p = i + 1;
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`h-9 w-9 rounded-lg text-sm font-semibold transition ${
              p === page ? 'bg-primary-600 text-white shadow-sm' : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {p}
          </button>
        );
      })}
      <button
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
};

export const RatingStars = ({ rating, size = 16, showValue }: { rating: number; size?: number; showValue?: boolean }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill={i <= Math.round(rating) ? '#f59e0b' : '#e2e8f0'} aria-hidden>
        <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
      </svg>
    ))}
    {showValue && <span className="ml-1.5 text-xs font-semibold text-slate-600">{rating > 0 ? rating.toFixed(1) : 'New'}</span>}
  </span>
);
