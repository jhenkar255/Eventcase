import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck2, IndianRupee, Star, Store, TrendingUp } from 'lucide-react';
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend,
} from 'recharts';
import { bookingApi, vendorApi, getErrorMessage } from '../../services/api';
import type { Booking, Vendor } from '../../types';
import { Card, Badge, statusBadgeColor, LoadingSpinner, ErrorBanner, EmptyState, Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, formatTime12 } from '../../utils/format';

const PIE_COLORS = ['#3b6cf6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const VendorDashboardPage = () => {
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([bookingApi.list({ limit: 100 }), vendorApi.myProfile()])
      .then(async ([bRes, vRes]) => {
        const bd = bRes.data.data;
        setBookings(bd.bookings as Booking[]);
        const v = (vRes.data.data as { vendor?: Vendor } | null)?.vendor;
        if (v) setVendor(v);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner full label="Loading your dashboard…" />;
  if (error) return <ErrorBanner message={error} />;

  // If no vendor profile yet → onboarding prompt
  if (!vendor) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <span className="inline-flex rounded-2xl bg-primary-50 p-5 text-primary-600"><Store size={40} /></span>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Set up your vendor profile</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
          Tell customers about your business so you can start receiving bookings on EventEase.
        </p>
        <Link to="/vendor/profile" className="mt-6 inline-block"><Button size="lg">Create my profile</Button></Link>
      </div>
    );
  }

  const totalRevenue = bookings.filter((b) => b.paymentStatus === 'paid').reduce((s, b) => s + b.amount, 0);
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const upcoming = bookings
    .filter((b) => b.status === 'confirmed' && new Date(b.date) >= new Date())
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    .slice(0, 5);

  // Bookings per month chart
  const byMonth: Record<string, number> = {};
  bookings.forEach((b) => {
    const key = new Date(b.date).toLocaleDateString('en-IN', { month: 'short' });
    byMonth[key] = (byMonth[key] ?? 0) + 1;
  });
  const monthData = Object.entries(byMonth).map(([m, c]) => ({ month: m, bookings: c }));

  // Status breakdown
  const statusData = ['confirmed', 'completed', 'pending', 'rejected']
    .map((s) => ({ name: s, value: bookings.filter((b) => b.status === s).length }))
    .filter((s) => s.value > 0);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{vendor.businessName}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Welcome back, {user?.name?.split(' ')[0]} · {vendor.category}
            {vendor.verificationStatus !== 'approved' && (
              <Badge color="amber" className="ml-2">{vendor.verificationStatus}</Badge>
            )}
          </p>
        </div>
        <Link to="/vendor/services"><Button>+ Add service</Button></Link>
      </div>

      {vendor.verificationStatus !== 'approved' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Your profile is awaiting admin approval. You'll start appearing in search results once approved.
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: CalendarCheck2, label: 'Total bookings', value: bookings.length, tint: 'bg-primary-50 text-primary-600' },
          { icon: TrendingUp, label: 'Pending requests', value: pendingCount, tint: 'bg-amber-50 text-amber-600' },
          { icon: IndianRupee, label: 'Earned (paid)', value: formatCurrency(totalRevenue), tint: 'bg-emerald-50 text-emerald-600' },
          { icon: Star, label: 'Avg rating', value: `${vendor.rating.toFixed(1)} (${vendor.reviewCount})`, tint: 'bg-purple-50 text-purple-600' },
        ].map(({ icon: Icon, label, value, tint }) => (
          <Card key={label} className="flex items-center gap-3 p-5">
            <span className={`rounded-xl p-3 ${tint}`}><Icon size={20} /></span>
            <div className="min-w-0">
              <p className="truncate text-xl font-extrabold text-slate-900">{value}</p>
              <p className="text-xs font-medium text-slate-500">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5" style={{ height: 300 }}>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Bookings by month</h2>
          {monthData.length === 0 ? (
            <p className="pt-16 text-center text-sm text-slate-400">No booking data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height="85%">
              <ReBarChart data={monthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="bookings" fill="#3b6cf6" radius={[6, 6, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5" style={{ height: 300 }}>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Status breakdown</h2>
          {statusData.length === 0 ? (
            <p className="pt-16 text-center text-sm text-slate-400">No booking data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height="85%">
              <RePieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconSize={9} wrapperStyle={{ fontSize: 11 }} />
              </RePieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Upcoming confirmed */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Next confirmed events</h2>
          <Link to="/vendor/bookings" className="text-sm font-semibold text-primary-600 hover:text-primary-800">View all</Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No upcoming confirmed bookings.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {upcoming.map((b) => {
              const ev = typeof b.eventId === 'object' ? b.eventId : null;
              return (
                <li key={b._id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{ev?.name ?? 'Private event'}</p>
                    <p className="text-xs text-slate-400">
                      {formatDate(b.date)} · {formatTime12(b.startTime)}–{formatTime12(b.endTime)} · {formatCurrency(b.amount)}
                    </p>
                  </div>
                  <Badge color={statusBadgeColor(b.paymentStatus)}>{b.paymentStatus}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
};
