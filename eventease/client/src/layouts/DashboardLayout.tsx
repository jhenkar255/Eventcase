import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Building2, Store, Briefcase, CalendarCheck,
  CreditCard, Star, Users as UsersIcon, Receipt, Menu, X, Sparkles, ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationDropdown } from '../components/NotificationDropdown';
import { LoadingSpinner } from '../components/ui';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
}

const customerNav: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/events', label: 'My Events', icon: CalendarDays },
  { to: '/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/payments/list', label: 'Payments', icon: CreditCard },
  { to: '/venues', label: 'Browse Venues', icon: Building2 },
  { to: '/vendors', label: 'Find Vendors', icon: Store },
];

const vendorNav: NavItem[] = [
  { to: '/vendor', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/vendor/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/vendor/services', label: 'Services', icon: Briefcase },
  { to: '/vendor/reviews', label: 'Reviews', icon: Star },
  { to: '/vendor/availability', label: 'Availability', icon: CalendarDays },
  { to: '/vendor/profile', label: 'Business Profile', icon: Store },
];

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: UsersIcon },
  { to: '/admin/vendors', label: 'Vendors', icon: Store },
  { to: '/admin/venues', label: 'Venues', icon: Building2 },
  { to: '/admin/events', label: 'Events', icon: CalendarDays },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/admin/payments', label: 'Payments', icon: Receipt },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
];

export const DashboardLayout = ({ role }: { role: 'customer' | 'vendor' | 'admin' }) => {
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner full />;
  if (!user) return null;

  const nav = role === 'admin' ? adminNav : role === 'vendor' ? vendorNav : customerNav;
  const title = role === 'admin' ? 'Admin Console' : role === 'vendor' ? 'Vendor Portal' : 'My Workspace';

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
            <Sparkles size={16} />
          </span>
          <span className="text-lg font-extrabold text-slate-900">
            Event<span className="text-primary-500">Ease</span>
          </span>
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden" aria-label="Close sidebar">
          <X size={20} />
        </button>
      </div>
      <p className="px-5 pb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4" aria-label="Dashboard navigation">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={['/dashboard', '/vendor', '/admin'].includes(item.to)}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <item.icon size={17} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-3">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          <ChevronLeft size={16} /> Back to site
        </Link>
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">{sidebar}</aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl lg:hidden">{sidebar}</aside>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
            <Menu size={22} />
          </button>
          <div className="hidden min-w-0 flex-1 lg:block" />
          <div className="flex flex-1 items-center justify-end gap-3">
            <NotificationDropdown />
            <div className="flex items-center gap-2.5">
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="h-9 w-9 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                  {user.name.charAt(0)}
                </span>
              )}
              <div className="hidden sm:block">
                <p className="max-w-[160px] truncate text-sm font-bold text-slate-900">{user.name}</p>
                <p className="text-xs capitalize text-slate-400">{user.role}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
