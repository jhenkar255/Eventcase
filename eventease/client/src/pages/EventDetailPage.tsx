import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, Pencil, Trash2, CalendarDays, MapPin, Users, Wallet,
  Clock, ListChecks, UserRound, CalendarCheck2, IndianRupee, ArrowRight,
} from 'lucide-react';
import { eventApi, getErrorMessage } from '../services/api';
import type { Event, Guest, Task, Expense, Booking } from '../types';
import { LoadingSpinner, ErrorBanner, Badge, statusBadgeColor, Button, ConfirmDialog, Card, EmptyState, Tabs } from '../components/ui';
import { formatCurrency, formatDate, formatTime12, daysUntil } from '../utils/format';
import { TasksTab } from './event/TasksTab';
import { GuestsTab, ScheduleTab } from './event/GuestsTab';
import { BudgetTab } from './event/BudgetTab';

export const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState<{ event: Event; guests: Guest[]; tasks: Task[]; expenses: Expense[]; bookings: Booking[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(() => {
    if (!id) return;
    eventApi
      .get(id)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  useEffect(() => {
    setLoading(true);
    reload();
    setLoading(false);
    window.scrollTo(0, 0);
  }, [reload]);

  if (loading || (!data && !error)) return <LoadingSpinner full label="Loading event…" />;
  if (error || !data)
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorBanner message={error || 'Event not found'} />
        <Link to="/events" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline">
          <ChevronLeft size={15} /> Back to my events
        </Link>
      </div>
    );

  const { event, guests, tasks, expenses, bookings } = data;
  const spent = expenses.reduce((s, e) => s + e.amount, 0);
  const days = daysUntil(event.date);

  const doDelete = async () => {
    setDeleting(true);
    try {
      await eventApi.remove(event._id);
      navigate('/events');
    } catch (err) {
      setError(getErrorMessage(err));
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <Link to="/events" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-800">
        <ChevronLeft size={15} /> My events
      </Link>

      {/* Header */}
      <div className="card-base relative mb-6 overflow-hidden">
        {event.image && (
          <div className="h-40 w-full overflow-hidden sm:h-52">
            <img src={event.image} alt={event.name} className="h-full w-full object-cover" loading="lazy" />
          </div>
        )}
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">{event.name}</h1>
                <Badge color="indigo">{event.type}</Badge>
                <Badge color={statusBadgeColor(event.status)}>{event.status}</Badge>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><CalendarDays size={15} className="text-primary-500" />{formatDate(event.date, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span className="flex items-center gap-1.5"><Clock size={15} className="text-primary-500" />{formatTime12(event.startTime)} – {formatTime12(event.endTime)}</span>
                <span className="flex items-center gap-1.5"><MapPin size={15} className="text-primary-500" />{event.location}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/events/${event._id}/edit`)}>
                <Pencil size={15} /> Edit
              </Button>
              <Button variant="outline" className="!text-red-600 hover:!border-red-300 hover:!bg-red-50" onClick={() => setConfirmDelete(true)} aria-label="Delete event">
                <Trash2 size={15} />
              </Button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 lg:grid-cols-4">
            {[
              { icon: Wallet, label: days >= 0 ? `In ${days} days` : 'Past event', value: `${days >= 0 ? days : Math.abs(days)}d`, color: 'text-primary-600' },
              { icon: Users, label: 'Guests invited', value: guests.reduce((s, g) => s + g.guestCount, 0).toLocaleString('en-IN'), color: 'text-slate-900' },
              { icon: IndianRupee, label: 'Budget used', value: `${event.budget > 0 ? Math.round((spent / event.budget) * 100) : 0}%`, color: spent > event.budget ? 'text-red-600' : 'text-emerald-600' },
              { icon: CalendarCheck2, label: 'Bookings', value: String(bookings.length), color: 'text-slate-900' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label}>
                <p className={`flex items-center gap-1.5 text-lg font-extrabold ${color}`}><Icon size={16} /> {value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview', icon: ListChecks },
          { id: 'schedule', label: 'Schedule', icon: Clock, count: tasks.length },
          { id: 'guests', label: 'Guests', icon: UserRound, count: guests.length },
          { id: 'budget', label: 'Budget', icon: Wallet },
          { id: 'bookings', label: 'Bookings', icon: CalendarCheck2, count: bookings.length },
          { id: 'tasks', label: 'Tasks', icon: ListChecks, count: tasks.filter((t) => t.status !== 'completed').length },
        ]}
      />

      <div className="py-6">
        {tab === 'overview' && (
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <Card className="p-6">
              <h3 className="font-bold text-slate-900">About this event</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{event.description || 'No description added yet.'}</p>
              <dl className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm">
                {[
                  ['Event type', event.type],
                  ['Expected guests', `${event.guestCount.toLocaleString('en-IN')} people`],
                  ['Total budget', formatCurrency(event.budget)],
                  ['Spent so far', formatCurrency(spent)],
                  ['Remaining budget', formatCurrency(event.budget - spent)],
                  ['Created on', formatDate(event.createdAt)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="font-semibold text-slate-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Next steps</h3>
                <div className="space-y-2 text-sm">
                  <Link to="/vendors" className="flex items-center justify-between rounded-lg px-3 py-2.5 font-medium text-slate-700 transition hover:bg-primary-50 hover:text-primary-700">
                    Find vendors <ArrowRight size={14} />
                  </Link>
                  <Link to="/venues" className="flex items-center justify-between rounded-lg px-3 py-2.5 font-medium text-slate-700 transition hover:bg-primary-50 hover:text-primary-700">
                    Find venues <ArrowRight size={14} />
                  </Link>
                  <button onClick={() => setTab('guests')} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left font-medium text-slate-700 transition hover:bg-primary-50 hover:text-primary-700">
                    Invite guests <ArrowRight size={14} />
                  </button>
                  <button onClick={() => setTab('tasks')} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left font-medium text-slate-700 transition hover:bg-primary-50 hover:text-primary-700">
                    Plan schedule & tasks <ArrowRight size={14} />
                  </button>
                  <Link to={`/events/${event._id}/recommendations`} className="flex items-center justify-between rounded-lg px-3 py-2.5 font-medium text-slate-700 transition hover:bg-primary-50 hover:text-primary-700">
                    Get AI-style recommendations <ArrowRight size={14} />
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === 'schedule' && <ScheduleTab tasks={tasks} />}

        {tab === 'guests' && <GuestsTab eventId={event._id} guests={guests} reload={reload} />}

        {tab === 'budget' && <BudgetTab eventId={event._id} expenses={expenses} budget={event.budget} reload={reload} />}

        {tab === 'bookings' && (
          <div>
            {bookings.length === 0 ? (
              <EmptyState
                icon={CalendarCheck2}
                title="No bookings for this event"
                message="Browse venues and vendors to make your first booking."
                action={
                  <div className="flex gap-2">
                    <Link to="/venues"><Button variant="outline">Browse venues</Button></Link>
                    <Link to="/vendors"><Button>Find vendors</Button></Link>
                  </div>
                }
              />
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => {
                  const vname = typeof b.vendorId === 'object' && b.vendorId?.businessName ? b.vendorId.businessName : null;
                  const vname2 = typeof b.venueId === 'object' && b.venueId?.name ? b.venueId.name : null;
                  return (
                    <Card key={b._id} className="flex flex-wrap items-center gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900">{vname ?? vname2 ?? 'Booking'}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatDate(b.date)} · {formatTime12(b.startTime)}–{formatTime12(b.endTime)}
                          {' · '}
                          {formatCurrency(b.amount)}
                        </p>
                      </div>
                      <Badge color={statusBadgeColor(b.status)}>{b.status}</Badge>
                      <Badge color={statusBadgeColor(b.paymentStatus)}>payment: {b.paymentStatus}</Badge>
                      <Link to="/bookings" className="text-sm font-semibold text-primary-600 hover:text-primary-800">
                        Manage <ArrowRight size={13} className="inline" />
                      </Link>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'tasks' && <TasksTab eventId={event._id} tasks={tasks} reload={reload} />}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this event?"
        message={`"${event.name}" and its guests, tasks, expenses will be permanently deleted. Active bookings will be cancelled.`}
        confirmLabel="Delete permanently"
        danger
        loading={deleting}
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
};
