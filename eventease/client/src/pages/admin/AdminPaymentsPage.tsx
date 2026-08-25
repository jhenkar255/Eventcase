import { useEffect, useState, useCallback } from 'react';
import { CreditCard } from 'lucide-react';
import { adminApi, getErrorMessage } from '../../services/api';
import type { AdminPayment } from '../../types';
import {
  Badge, statusBadgeColor, LoadingSpinner, EmptyState, ErrorBanner,
  Pagination, Select, Card,
} from '../../components/ui';
import { formatCurrency, formatDateTime } from '../../utils/format';

export const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    adminApi
      .payments({ page, limit: 15, ...(statusFilter ? { status: statusFilter } : {}) })
      .then((res) => {
        const d = res.data.data;
        setPayments(d.payments as AdminPayment[]);
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
          <h1 className="text-2xl font-extrabold text-slate-900">Transactions</h1>
          <p className="mt-1 text-sm text-slate-500">All payments processed on the platform</p>
        </div>
        <select aria-label="Filter by payment status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-base max-w-[180px]">
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} onRetry={load} /></div>}

      {loading ? (
        <LoadingSpinner full label="Loading transactions…" />
      ) : payments.length === 0 ? (
        <EmptyState icon={CreditCard} title="No transactions" message="Payments will appear here once customers start paying." />
      ) : (
        <>
          <Card className="divide-y divide-slate-100 overflow-hidden p-0">
            {payments.map((p) => {
              const payer = typeof p.customerId === 'object' && p.customerId ? p.customerId.name : '—';
              return (
                <div key={p._id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50/70">
                  <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600"><CreditCard size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{formatCurrency(p.amount)} · {payer}</p>
                    <p className="truncate text-xs text-slate-400">{formatDateTime(p.createdAt)} · {p.paymentMethod.toUpperCase()} · {p.transactionId}</p>
                  </div>
                  <Badge color={statusBadgeColor(p.status)}>{p.status}</Badge>
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
