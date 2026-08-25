import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, CalendarDays } from 'lucide-react';
import { eventApi, getErrorMessage } from '../services/api';
import type { Event } from '../types';
import { EventCard } from '../components/Cards';
import { Button, EmptyState, LoadingSpinner, ErrorBanner, Pagination, Select, Input, ConfirmDialog } from '../components/ui';
import { EVENT_TYPES } from '../utils/constants';

export const MyEventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [params, setParams] = useState({ page: 1, type: '', status: '', search: '' });
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    setError('');
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== 0));
    eventApi
      .list({ ...clean, limit: 9 })
      .then((res) => {
        const d = res.data.data;
        setEvents(d.events as Event[]);
        setPages(d.pages as number);
        setTotal(d.total as number);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await eventApi.remove(deleteTarget._id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Events</h1>
          <p className="mt-1 text-sm text-slate-500">{loading ? 'Loading…' : `${total} events`}</p>
        </div>
        <Link to="/events/create">
          <Button><Plus size={17} /> Create Event</Button>
        </Link>
      </div>

      <div className="card-base mb-6 grid gap-3 p-4 sm:grid-cols-3">
        <Input id="ev-search" label="Search" placeholder="Name or location…" value={params.search} onChange={(e) => setParams((p) => ({ ...p, search: e.target.value, page: 1 }))} />
        <Select
          id="ev-type"
          label="Type"
          placeholder="All types"
          options={EVENT_TYPES.map((t) => ({ value: t, label: t }))}
          value={params.type}
          onChange={(e) => setParams((p) => ({ ...p, type: e.target.value, page: 1 }))}
        />
        <Select
          id="ev-status"
          label="Status"
          placeholder="All statuses"
          options={[
            { value: 'planning', label: 'Planning' },
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'ongoing', label: 'Ongoing' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
          value={params.status}
          onChange={(e) => setParams((p) => ({ ...p, status: e.target.value, page: 1 }))}
        />
      </div>

      {error ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : loading ? (
        <LoadingSpinner full label="Loading your events…" />
      ) : events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events yet"
          message="Create your first event to start planning venues, vendors, guests and budget."
          action={
            <Link to="/events/create">
              <Button><Plus size={16} /> Create your first event</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {events.map((e) => (
              <EventCard key={e._id} event={e} onClick={() => navigate(`/events/${e._id}`)} />
            ))}
          </div>
          <Pagination page={params.page} pages={pages} onChange={(p) => setParams((x) => ({ ...x, page: p }))} />
        </>
      )}

      {/* Quick actions under each card handled in detail page; delete via detail page too */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete event?"
        message={`"${deleteTarget?.name}" and its guests, tasks and expenses will be permanently deleted.`}
        confirmLabel="Delete event"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
