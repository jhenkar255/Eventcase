import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck2, CreditCard, XCircle, Star } from 'lucide-react';
import { bookingApi, paymentApi, getErrorMessage } from '../services/api';
import type { Booking, Review as ReviewType } from '../types';
import {
  Button, Badge, statusBadgeColor, LoadingSpinner, EmptyState, ErrorBanner,
  Pagination, Select, ConfirmDialog, Card,
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { PaymentModal } from '../components/PaymentModal';
import { ReviewModal } from '../components/ReviewModal';
import { formatCurrency, formatDate, formatTime12 } from '../utils/format';

export const BookingsPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payTarget, setPayTarget] = useState<Booking | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const { toast } = useToast();
  const [reviewsByBooking, setReviewsByBooking] = useState<Record<string, boolean>>({});

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    bookingApi
      .list({ page, limit: 10, ...(statusFilter ? { status: statusFilter } : {}) })
      .then(async (res) => {
        const d = res.data.data;
        setBookings(d.bookings as Booking[]);
        setPages(d.pages as number);
        // fetch which completed bookings already have reviews
        const completedIds: string[] = (d.bookings as Booking[]).filter((b) => b.status === 'completed').map((b) => b._id);
        if (completedIds.length) {
          const checks = await Promise.all(
            completedIds.map((id) => bookingApi.get(id).then((r) => [id, !!r.data.data.review]).catch(() => [id, false]))
          );
          setReviewsByBooking(Object.fromEntries(checks));
        }
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(load, [load]);

  const cancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await bookingApi.cancel(cancelTarget._id);
      toast('success', 'Booking cancelled');
      setCancelTarget(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
      setCancelTarget(null);
    } finally {
      setCancelling(false);
    }
  };

  const nameOf = (b: Booking): string => {
    if (typeof b.vendorId === 'object' && b.vendorId) return b.vendorId.businessName ?? 'Vendor';
    if (typeof b.venueId === 'object' && b.venueId) return b.venueId.name ?? 'Venue';
    return 'Provider';
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">Track requests, payments and reviews</p>
        </div>
        <select
          aria-label="Filter bookings by status"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-base max-w-[180px]"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} onRetry={load} /></div>}

      {loading ? (
        <LoadingSpinner full label="Loading bookings…" />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={CalendarCheck2}
          title="No bookings yet"
          message="Browse venues and vendors to make your first booking."
          action={
            <div className="flex gap-2">
              <Link to="/venues"><Button variant="outline">Venues</Button></Link>
              <Link to="/vendors"><Button>Vendors</Button></Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <Card key={b._id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900">{nameOf(b)}</h3>
                    <Badge color={statusBadgeColor(b.status)}>{b.status}</Badge>
                    <Badge color={statusBadgeColor(b.paymentStatus)}>{b.paymentStatus}</Badge>
                  </div>
                  {typeof b.eventId === 'object' && b.eventId?.name && (
                    <p className="mt-0.5 text-xs text-slate-400">for event: {b.eventId.name}</p>
                  )}
                  <p className="mt-1.5 text-sm text-slate-500">
                    {formatDate(b.date)} · {formatTime12(b.startTime)}–{formatTime12(b.endTime)}
                    {b.guestCount ? ` · ${b.guestCount} guests` : ''}
                  </p>
                  {typeof b.serviceId === 'object' && b.serviceId?.name && (
                    <p className="mt-0.5 text-xs text-primary-600">Service: {b.serviceId.name}</p>
                  )}
                </div>
                <p className="text-lg font-extrabold text-slate-900">{formatCurrency(b.amount)}</p>
              </div>

              {/* Action row */}
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                {b.status === 'confirmed' && b.paymentStatus !== 'paid' && (
                  <Button size="sm" onClick={() => setPayTarget(b)}>
                    <CreditCard size={14} /> Pay now
                  </Button>
                )}
                {(b.status === 'pending' || b.status === 'confirmed') && (
                  <Button size="sm" variant="outline" onClick={() => setCancelTarget(b)}>
                    <XCircle size={14} /> Cancel booking
                  </Button>
                )}
                {b.status === 'completed' &&
                  (reviewsByBooking[b._id] ? (
                    <span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                      <Star size={13} fill="#059669" /> Reviewed
                    </span>
                  ) : (
                    <Button size="sm" variant="success" onClick={() => setReviewTarget(b)}>
                      <Star size={14} /> Write review
                    </Button>
                  ))}
              </div>
            </Card>
          ))}
          <Pagination page={page} pages={pages} onChange={setPage} />
        </div>
      )}

      <PaymentModal open={!!payTarget} onClose={() => setPayTarget(null)} booking={payTarget} onPaid={load} />
      {reviewTarget && (
        <ReviewModal open onClose={() => setReviewTarget(null)} bookingId={reviewTarget._id} targetName={nameOf(reviewTarget)} onSubmitted={load} />
      )}
      <ConfirmDialog open={!!cancelTarget} title="Cancel this booking?" message={`Your booking with ${cancelTarget ? nameOf(cancelTarget) : ''} on ${cancelTarget ? formatDate(cancelTarget.date) : ''} will be cancelled.`} confirmLabel="Yes, cancel it" danger loading={cancelling} onConfirm={cancel} onCancel={() => setCancelTarget(null)} />
    </div>
  );
};

// Re-export for route use
export type { ReviewType };
