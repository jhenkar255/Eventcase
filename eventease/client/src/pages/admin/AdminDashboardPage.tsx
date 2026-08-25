import { useEffect, useState } from 'react';
import {
  Users as UsersIcon, CalendarDays, Store, Building2, CalendarCheck2,
  IndianRupee, Star, ShieldCheck, TrendingUp,
} from 'lucide-react';
import {
  AreaChart as ReAreaChart, Area, BarChart as ReBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend,
} from 'recharts';
import { adminApi, getErrorMessage } from '../../services/api';
import type { AdminDashboard as AdminDashboardData, Booking } from '../../types';
import { Card, LoadingSpinner, ErrorBanner, Badge, statusBadgeColor } from '../../components/ui';
import { formatCurrency, formatDateTime, formatDate } from '../../utils/format';

const PIE_COLORS = ['#3b6cf6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const AdminDashboardPage = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([adminApi.dashboard(), adminApi.bookings({ limit: 8 })])
      .then(([dRes, bRes]) => {
        setData(dRes.data.data as AdminDashboardData);
        setRecentBookings(bRes.data.data.bookings as Booking[]);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner full label="Loading platform stats…" />;
  if (error || !data) return <ErrorBanner message={error || 'Failed to load stats'} />;

  const s = data.stats;
  const statCards = [
    { icon: UsersIcon, label: 'Customers', value: s.totalUsers.toLocaleString('en-IN'), sub: undefined as string | undefined, tint: 'bg-primary-50 text-primary-600' },
    { icon: Store, label: 'Vendors', value: String(s.totalVendors), sub: `${s.pendingVendors} awaiting approval`, tint: 'bg-amber-50 text-amber-600' },
    { icon: Building2, label: 'Venues', value: String(s.totalVenues), sub: undefined, tint: 'bg-emerald-50 text-emerald-600' },
    { icon: CalendarDays, label: 'Events created', value: s.totalEvents.toLocaleString('en-IN'), sub: undefined, tint: 'bg-cyan-50 text-cyan-600' },
    { icon: CalendarCheck2, label: 'Total bookings', value: s.totalBookings.toLocaleString('en-IN'), sub: undefined, tint: 'bg-purple-50 text-purple-600' },
    { icon: IndianRupee, label: 'Revenue collected', value: formatCurrency(s.totalRevenue), sub: `${s.successfulPayments} successful payments`, tint: 'bg-green-50 text-green-700' },
    { icon: Star, label: 'Reviews', value: s.totalReviews.toLocaleString('en-IN'), sub: undefined, tint: 'bg-yellow-50 text-yellow-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
          <ShieldCheck size={24} className="text-primary-600" /> Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">Platform overview and health</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ icon: Icon, label, value, sub, tint }) => (
          <Card key={label} className="p-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-1 truncate text-2xl font-extrabold text-slate-900">{value}</p>
              </div>
              <span className={`rounded-xl p-2.5 ${tint}`}><Icon size={18} /></span>
            </div>
            {sub && <p className="mt-1.5 text-[11px] text-slate-400">{sub}</p>}
          </Card>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3" style={{ height: 300 }}>
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-slate-500">
            <TrendingUp size={14} /> New users by month
          </h2>
          {data.charts.usersByMonth.length === 0 ? (
            <p className="pt-16 text-center text-sm text-slate-400">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height="85%">
              <ReAreaChart data={data.charts.usersByMonth}>
                <defs>
                  <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b6cf6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3b6cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="#3b6cf6" fill="url(#gradUsers)" strokeWidth={2} />
              </ReAreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5 lg:col-span-2" style={{ height: 300 }}>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Bookings by status</h2>
          {data.charts.bookingsByStatus.length === 0 ? (
            <p className="pt-16 text-center text-sm text-slate-400">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height="85%">
              <RePieChart>
                <Pie data={data.charts.bookingsByStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {data.charts.bookingsByStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={9} wrapperStyle={{ fontSize: 11 }} />
              </RePieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3" style={{ height: 300 }}>
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-slate-500">
            <IndianRupee size={14} /> Revenue by month
          </h2>
          {data.charts.revenueByMonth.length === 0 ? (
            <p className="pt-16 text-center text-sm text-slate-400">No payments yet</p>
          ) : (
            <ResponsiveContainer width="100%" height="85%">
              <ReBarChart data={data.charts.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => (v >= 100000 ? `${Math.round(v / 100000)}L` : v >= 1000 ? `${Math.round(v / 1000)}K` : String(v))} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5 lg:col-span-2" style={{ height: 300 }}>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Events by category</h2>
          {data.charts.eventsByCategory.length === 0 ? (
            <p className="pt-16 text-center text-sm text-slate-400">No events yet</p>
          ) : (
            <ResponsiveContainer width="100%" height="85%">
              <RePieChart>
                <Pie data={data.charts.eventsByCategory} dataKey="value" nameKey="name" innerRadius={40} outerRadius={75} paddingAngle={2}>
                  {data.charts.eventsByCategory.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={9} wrapperStyle={{ fontSize: 10 }} />
              </RePieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Rating distribution */}
      {data.charts.reviewsByRating.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-slate-500">
            <Star size={14} /> Review ratings breakdown
          </h2>
          <div className="space-y-2.5">
            {data.charts.reviewsByRating.map((r) => {
              const max = Math.max(...data.charts.reviewsByRating.map((x) => x.count));
              return (
                <div key={r.rating} className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-xs font-semibold text-slate-500">{r.rating}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${max > 0 ? Math.round((r.count / max) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs font-bold text-slate-700">{r.count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Recent bookings */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Latest bookings</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {recentBookings.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-400">No bookings yet.</p>}
          {recentBookings.map((b) => {
            const cust = typeof b.customerId === 'object' && b.customerId ? b.customerId.name : '—';
            const provider =
              typeof b.vendorId === 'object' && b.vendorId?.businessName
                ? b.vendorId.businessName
                : typeof b.venueId === 'object' && b.venueId?.name
                ? b.venueId.name
                : '—';
            return (
              <div key={b._id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50/70">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{cust} → {provider}</p>
                  <p className="text-xs text-slate-400">{formatDate(b.date)} · booked {formatDateTime(b.createdAt)}</p>
                </div>
                <p className="text-sm font-bold text-slate-900">{formatCurrency(b.amount)}</p>
                <Badge color={statusBadgeColor(b.status)}>{b.status}</Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
