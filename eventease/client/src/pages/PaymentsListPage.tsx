import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import { paymentApi, getErrorMessage } from '../services/api';
import type { Payment } from '../types';
import { Badge, statusBadgeColor, Button, LoadingSpinner, EmptyState, ErrorBanner, Pagination, Card } from '../components/ui';
import { formatCurrency, formatDateTime } from '../utils/format';

export const PaymentsListPage = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    paymentApi.list({ page, limit: 12 })
      .then((res) => {
        const d = res.data.data;
        setPayments(d.payments as Payment[]);
        setPages(d.pages as number);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(load, [load]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-extrabold text-slate-900">My Payments</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">All your transactions in one place</p>

      {error && <div className="mb-4"><ErrorBanner message={error} onRetry={load} /></div>}

      {loading ? (
        <LoadingSpinner full label="Loading payments…" />
      ) : payments.length === 0 ? (
        <EmptyState icon={CreditCard} title="No payments yet" message="Once you pay for a booking, receipts appear here." action={<Link to="/bookings"><Button>Go to bookings</Button></Link>} />
      ) : (
        <>
          <Card className="divide-y divide-slate-100 overflow-hidden">
            {payments.map((p) => (
              <div key={p._id} className="flex flex-wrap items-center gap-3 px-4 py-4 transition hover:bg-slate-50/70">
                <span className="rounded-lg bg-primary-50 p-2 text-primary-600">
                  <CreditCard size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{formatCurrency(p.amount)}</p>
                  <p className="truncate text-xs text-slate-400">
                    {formatDateTime(p.createdAt)} · {p.paymentMethod.toUpperCase()} · txn {p.transactionId}
                  </p>
                </div>
                <Badge color={statusBadgeColor(p.status)}>{p.status}</Badge>
                <Link to={`/payments/${p._id}`} className="text-sm font-semibold text-primary-600 hover:text-primary-800">
                  Receipt
                </Link>
              </div>
            ))}
          </Card>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}
    </div>
  );
};
