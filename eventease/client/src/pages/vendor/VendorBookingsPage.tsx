import { useEffect, useState, useCallback } from 'react';
import { CalendarCheck2, Check, X, CheckCircle2 } from 'lucide-react';
import { bookingApi, getErrorMessage } from '../../services/api';
import type { Booking } from '../../types';
import { Button, Badge, statusBadgeColor, LoadingSpinner, EmptyState, ErrorBanner, Pagination, Select, ConfirmDialog, Card } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, formatTime12 } from '../../utils/format';

export const VendorBookingsPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionTarget, setActionTarget] = useState<{ booking: Booking; action: 'confirm' | 'reject' | 'complete' } | null>(null);
  const [acting, setActing] = useState(false);
  const { toast } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    bookingApi
      .list({ page, limit: 10, ...(statusFilter ? { status: statusFilter } : {}) })
      .then((res) => {
        const d = res.data.data;
        setBookings(d.bookings as Booking[]);
        setPages(d.pages as number);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(load, [load]);

  const act = async () => {
    if (!actionTarget) return;
    setActing(true);
    try {
      if (actionTarget.action === 'confirm') await bookingApi.updateStatus(actionTarget.booking._id, 'confirmed');
      else if (actionTarget.action === 'reject') await bookingApi.updateStatus(actionTarget.booking._id, 'rejected');
      else await bookingApi.updateStatus(actionTarget.booking._id, 'completed');
      setActionTarget(null);
      toast('success', `Booking ${actionTarget.action === 'confirm' ? 'confirmed' : actionTarget.action === 'reject' ? 'rejected' : 'completed'} successfully`);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
      setActionTarget(null);
    } finally {
      setActing(false);
    }
  };

  const customerName = (b: Booking): string => {
    const u = typeof b.customerId === 'object' && b.customerId ? b.customerId : null;
    return u ? u.name : 'Customer';
  };
  const eventName = (b: Booking): string =>
    typeof b.eventId === 'object' && b.eventId?.name ? b.eventId.name : '';

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">Requests from customers</p>
        </div>
        <select
          aria-label="Filter by status"
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
        <EmptyState icon={CalendarCheck2} title="No bookings" message={statusFilter ? `No ${statusFilter} bookings right now.` : 'New booking requests will appear here.'} />
      ) : (
        <>
          <div className="space-y-4">
            {bookings.map((b) => (
              <Card key={b._id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900">{customerName(b)}</h3>
                      <Badge color={statusBadgeColor(b.status)}>{b.status}</Badge>
                      <Badge color={statusBadgeColor(b.paymentStatus)}>{b.paymentStatus}</Badge>
                    </div>
                    {eventName(b) && <p className="mt-0.5 text-xs text-primary-600">{eventName(b)}</p>}
                    {typeof b.serviceId === 'object' && b.serviceId?.name && (
                      <p className="text-xs text-slate-400">Service: {b.serviceId.name}</p>
                    )}
                    <p className="mt-1.5 text-sm text-slate-500">
                      {formatDate(b.date)} · {formatTime12(b.startTime)}–{formatTime12(b.endTime)}
                      {b.guestCount ? ` · ${b.guestCount} guests` : ''}
                    </p>
                    {b.notes && <p className="mt-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs italic text-slate-500">"{b.notes}"</p>}
                  </div>
                  <p className="text-lg font-extrabold text-slate-900">{formatCurrency(b.amount)}</p>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  {b.status === 'pending' && (
                    <>
                      <Button size="sm" variant="success" onClick={() => setActionTarget({ booking: b, action: 'confirm' })}>
                        <Check size={14} /> Accept
                      </Button>
                      <Button size="sm" variant="outline" className="!text-red-600 hover:!border-red-300 hover:!bg-red-50" onClick={() => setActionTarget({ booking: b, action: 'reject' })}>
                        <X size={14} /> Reject
                      </Button>
                    </>
                  )}
                  {b.status === 'confirmed' && new Date(b.date) <= new Date() && (
                    <Button size="sm" variant="success" onClick={() => setActionTarget({ booking: b, action: 'complete' })}>
                      <CheckCircle2 size={14} /> Mark completed
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={!!actionTarget}
        title={
          actionTarget?.action === 'confirm' ? 'Accept this booking?' :
          actionTarget?.action === 'reject' ? 'Reject this booking?' : 'Mark as completed?'
        }
        message={
          actionTarget?.action === 'confirm'
            ? `${customerName(actionTarget.booking)} will be notified and can then pay online.`
            : actionTarget?.action === 'reject'
            ? `${customerName(actionTarget.booking)} will be notified of the rejection.`
            : 'The customer will be able to write a review after completion.'
        }
        confirmLabel={actionTarget?.action === 'confirm' ? 'Accept' : actionTarget?.action === 'reject' ? 'Reject' : 'Mark completed'}
        danger={actionTarget?.action === 'reject'}
        loading={acting}
        onConfirm={act}
        onCancel={() => setActionTarget(null)}
      />
    </div>
  );
};
