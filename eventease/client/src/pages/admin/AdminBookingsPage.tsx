import { useEffect, useState, useCallback } from 'react';
import { CalendarCheck2 } from 'lucide-react';
import { adminApi, getErrorMessage } from '../../services/api';
import type { AdminBooking } from '../../types';
import {
  Badge, statusBadgeColor, LoadingSpinner, EmptyState, ErrorBanner,
  Pagination, Select, Card,
} from '../../components/ui';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';

export const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    adminApi
      .bookings({ page, limit: 12, ...(statusFilter ? { status: statusFilter } : {}) })
      .then((res) => {
        const d = res.data.data;
        setBookings(d.bookings as AdminBooking[]);
        setPages(d.pages as number);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(load, [load]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">All Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">Every booking across the platform</p>
        </div>
        <select aria-label="Filter by status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-base max-w-[180px]">
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
        <EmptyState icon={CalendarCheck2} title="No bookings found" message="No bookings match this filter." />
      ) : (
        <>
          <Card className="divide-y divide-slate-100 overflow-hidden p-0">
            {bookings.map((b) => {
              const cust = typeof b.customerId === 'object' && b.customerId ? b.customerId.name : '—';
              const provider =
                typeof b.vendorId === 'object' && b.vendorId?.businessName
                  ? b.vendorId.businessName
                  : typeof b.venueId === 'object' && b.venueId?.name
                  ? b.venueId.name
                  : '—';
              return (
                <div key={b._id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50/70">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{cust} → {provider}</p>
                    <p className="text-xs text-slate-400">{formatDate(b.date)} · booked {formatDateTime(b.createdAt)}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(b.amount)}</span>
                  <Badge color={statusBadgeColor(b.status)}>{b.status}</Badge>
                  <Badge color={statusBadgeColor(b.paymentStatus)}>{b.paymentStatus}</Badge>
                </div>
              );
            })}
          </Card>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}
    </div>
  );
};
