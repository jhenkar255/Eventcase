import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, ShieldCheck, ArrowLeft } from 'lucide-react';
import { paymentApi, getErrorMessage } from '../services/api';
import type { Payment } from '../types';
import { Badge, statusBadgeColor, LoadingSpinner, ErrorBanner, Button, Card } from '../components/ui';
import { formatCurrency, formatDateTime, formatDate } from '../utils/format';

export const PaymentReceiptPage = () => {
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    paymentApi
      .get(id)
      .then((res) => setPayment(res.data.data.payment as Payment))
      .catch((err) => setError(getErrorMessage(err)));
    window.scrollTo(0, 0);
  }, [id]);

  if (error)
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorBanner message={error} />
        <Link to="/payments/list" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline">
          <ArrowLeft size={15} /> Back to payments
        </Link>
      </div>
    );
  if (!payment) return <LoadingSpinner full label="Loading receipt…" />;

  const b = payment.bookingId;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between">
        <Link to="/payments/list" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-800">
          <ArrowLeft size={15} /> All payments
        </Link>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer size={14} /> Print
        </Button>
      </div>

      <Card className="overflow-hidden p-0 print:shadow-none">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-7 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary-100">EventEase · Payment Receipt</p>
              <p className="mt-1 text-2xl font-extrabold">{formatCurrency(payment.amount)}</p>
            </div>
            <ShieldCheck size={40} className="text-primary-200" />
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-700">
            <ShieldCheck size={20} />
            <p className="text-sm font-bold">Payment successful — this is a demo transaction (no real money moved)</p>
          </div>

          <dl className="space-y-0 text-sm">
            {[
              ['Transaction ID', payment.transactionId],
              ['Date & time', formatDateTime(payment.createdAt)],
              ['Payment method', payment.paymentMethod.toUpperCase()],
              ['Status', payment.status],
              ...(typeof b === 'object' && b
                ? [
                    ['Booked on', typeof b.vendorId === 'object' && b.vendorId?.businessName ? b.vendorId.businessName : typeof b.venueId === 'object' && b.venueId?.name ? b.venueId.name : 'Provider'],
                    ['Booking date', formatDate(b.date)],
                    ['Booking amount', formatCurrency(b.amount)],
                  ]
                : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-slate-100 py-3 last:border-0">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-right font-semibold capitalize text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 text-center text-xs text-slate-400">
            This is a computer-generated receipt for the EventEase demo platform.
          </p>
        </div>
      </Card>

      <div className="mt-5 flex justify-center gap-3 print:hidden">
        <Link to="/bookings"><Button variant="outline">View bookings</Button></Link>
      </div>
    </div>
  );
};
