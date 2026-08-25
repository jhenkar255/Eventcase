import { useEffect, useState, useCallback } from 'react';
import { CalendarDays } from 'lucide-react';
import { adminApi, getErrorMessage } from '../../services/api';
import type { AdminEvent } from '../../types';
import {
  Badge, statusBadgeColor, LoadingSpinner, EmptyState, ErrorBanner,
  Pagination, Select, Card,
} from '../../components/ui';
import { formatCurrency, formatDate } from '../../utils/format';

export const AdminEventsPage = () => {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    adminApi
      .events({ page, limit: 12, ...(typeFilter ? { type: typeFilter } : {}) })
      .then((res) => {
        const d = res.data.data;
        setEvents(d.events as AdminEvent[]);
        setPages(d.pages as number);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, typeFilter]);

  useEffect(load, [load]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Events</h1>
          <p className="mt-1 text-sm text-slate-500">All events created on the platform</p>
        </div>
        <select aria-label="Filter by event type" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="input-base max-w-[180px]">
          <option value="">All types</option>
          {['Wedding', 'Birthday', 'Corporate', 'Anniversary', 'Engagement', 'Other'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} onRetry={load} /></div>}

      {loading ? (
        <LoadingSpinner full label="Loading events…" />
      ) : events.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No events found" message="No events match this filter yet." />
      ) : (
        <>
          <Card className="divide-y divide-slate-100 overflow-hidden p-0">
            {events.map((ev) => {
              const owner = typeof ev.customerId === 'object' && ev.customerId ? ev.customerId.name : '—';
              return (
                <div key={ev._id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50/70">
                  <span className="rounded-lg bg-primary-50 px-2 py-1 text-xs font-bold text-primary-700">{ev.type}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{ev.name}</p>
                    <p className="truncate text-xs text-slate-400">by {owner} · {formatDate(ev.date)} · {ev.location}</p>
                  </div>
                  <span className="hidden text-xs text-slate-400 sm:block">{formatCurrency(ev.budget)}</span>
                  <Badge color={statusBadgeColor(ev.status)}>{ev.status}</Badge>
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
