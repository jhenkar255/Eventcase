import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays, Wallet, CalendarCheck2, ListChecks, Plus,
  ArrowRight, Users, TrendingUp,
} from 'lucide-react';
import {
  AreaChart as ReAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { userApi, getErrorMessage } from '../services/api';
import type { CustomerDashboard as DashboardData } from '../types';
import { Card, Badge, statusBadgeColor, LoadingSpinner, ErrorBanner, EmptyState, Button } from '../components/ui';
import { formatCurrency, formatDate, daysUntil } from '../utils/format';
import { useAuth } from '../context/AuthContext';

export const CustomerDashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    userApi
      .dashboard()
      .then((res) => setData(res.data.data as DashboardData))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner full label="Loading your dashboard…" />;
  if (error || !data) return <ErrorBanner message={error || 'Failed to load dashboard'} />;

  const s = data.stats;
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Welcome back, {firstName} 👋</h1>
          <p className="mt-0.5 text-sm text-slate-500">Here's what's happening with your events</p>
        </div>
        <Link to="/events/new"><Button><Plus size={16} /> New event</Button></Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: CalendarDays, label: 'Upcoming events', value: String(s.upcomingEvents), tint: 'bg-primary-50 text-primary-600' },
          { icon: CalendarCheck2, label: 'Pending bookings', value: String(s.pendingBookings), tint: 'bg-amber-50 text-amber-600' },
          { icon: Wallet, label: 'Budget used', value: `${s.budgetUsedPct}%`, sub: `${formatCurrency(s.amountSpent)} of ${formatCurrency(s.totalBudget)}`, tint: 'bg-emerald-50 text-emerald-600' },
          { icon: ListChecks, label: 'Open tasks', value: String(s.pendingTasks), tint: 'bg-purple-50 text-purple-600' },
        ].map(({ icon: Icon, label, value, sub, tint }) => (
          <Card key={label} className="p-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
                {sub && <p className="mt-0.5 truncate text-[11px] text-slate-400">{sub}</p>}
              </div>
              <span className={`rounded-xl p-2.5 ${tint}`}><Icon size={18} /></span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div className="space-y-5">
          {/* Upcoming events */}
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Upcoming events</h2>
              <Link to="/events" className="text-sm font-semibold text-primary-600 hover:text-primary-800">View all</Link>
            </div>
            {data.upcomingEvents.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No upcoming events"
                message="Create your first event to get started."
                action={<Link to="/events/new"><Button size="sm"><Plus size={14} /> Create event</Button></Link>}
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.upcomingEvents.map((ev) => (
                  <li key={ev._id}>
                    <Link to={`/events/${ev._id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition hover:bg-slate-50">
                      <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                        <span className="text-sm font-extrabold leading-none">{new Date(ev.date).getDate()}</span>
                        <span className="text-[9px] font-bold uppercase">{new Date(ev.date).toLocaleString('en-IN', { month: 'short' })}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-slate-900">{ev.name}</span>
                        <span className="block truncate text-xs text-slate-400">{formatDate(ev.date)} · {ev.location} · in {daysUntil(ev.date)} days</span>
                      </span>
                      <Badge color="indigo">{ev.type}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Budget chart */}
          {data.budgetSummary.length > 0 && (
            <Card className="p-5" style={{ height: 280 }}>
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-slate-500">
                <TrendingUp size={14} /> Spend vs budget (latest events)
              </h2>
              <ResponsiveContainer width="100%" height="82%">
                <ReAreaChart
                  data={data.budgetSummary.map((b) => ({ name: b.name.length > 12 ? `${b.name.slice(0, 12)}…` : b.name, spent: b.spent, budget: b.budget }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => (v >= 100000 ? `${Math.round(v / 100000)}L` : v >= 1000 ? `${Math.round(v / 1000)}K` : String(v))} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="budget" stroke="#94a3b8" fill="#f1f5f9" strokeWidth={2} name="Budget" />
                  <Area type="monotone" dataKey="spent" stroke="#3b6cf6" fill="#dbe7ff" strokeWidth={2} name="Spent" />
                </ReAreaChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Recent bookings */}
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Recent bookings</h2>
              <Link to="/bookings" className="text-sm font-semibold text-primary-600 hover:text-primary-800">Manage</Link>
            </div>
            {data.recentBookings.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No bookings yet — browse venues and vendors to make one.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recentBookings.map((b) => {
                  const provider =
                    typeof b.vendorId === 'object' && b.vendorId?.businessName
                      ? b.vendorId.businessName
                      : typeof b.venueId === 'object' && b.venueId?.name
                      ? b.venueId.name
                      : 'Booking';
                  return (
                    <li key={b._id} className="flex flex-wrap items-center gap-3 px-5 py-3 transition hover:bg-slate-50/70">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{provider}</p>
                        <p className="text-xs text-slate-400">{formatDate(b.date)}</p>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(b.amount)}</span>
                      <Badge color={statusBadgeColor(b.status)}>{b.status}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* RSVP stats */}
          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-slate-500">
              <Users size={14} /> Guest RSVPs
            </h2>
            {[
              ['Confirmed', data.rsvpStats.confirmed, 'bg-emerald-500'],
              ['Pending', data.rsvpStats.pending, 'bg-amber-400'],
              ['Declined', data.rsvpStats.declined, 'bg-red-400'],
            ].map(([label, value, color]) => {
              const total = Math.max(1, data.rsvpStats.invited);
              return (
                <div key={String(label)} className="mb-3 last:mb-0">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium text-slate-600">{label}</span>
                    <span className="font-bold text-slate-900">{value as number}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.round(((value as number) / total) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
            <p className="mt-2 text-xs text-slate-400">{data.rsvpStats.invited.toLocaleString('en-IN')} people invited in total</p>
          </Card>

          {/* Pending tasks */}
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">To-do next</h2>
            </div>
            {data.pendingTasks.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">All caught up! 🎉</p>
            ) : (
              <ul className="space-y-2">
                {data.pendingTasks.slice(0, 6).map((t) => (
                  <li key={t._id}>
                    <Link
                      to={`/events/${t.eventId._id}`}
                      className="block rounded-lg border border-slate-100 px-3 py-2.5 transition hover:border-primary-200 hover:bg-primary-50/40"
                    >
                      <p className="truncate text-sm font-semibold text-slate-800">{t.title}</p>
                      <p className="text-xs text-slate-400">{t.eventId.name} · due {formatDate(t.date)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Quick links */}
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Explore</h2>
            <div className="space-y-2 text-sm">
              {[
                ['/venues', 'Browse venues'],
                ['/vendors', 'Find vendors'],
                ['/search', 'Search everything'],
              ].map(([to, label]) => (
                <Link key={to} to={to} className="flex items-center justify-between rounded-lg px-3 py-2 font-semibold text-slate-700 transition hover:bg-primary-50 hover:text-primary-700">
                  {label} <ArrowRight size={14} />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
