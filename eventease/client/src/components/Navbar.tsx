import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, CalendarCheck, LogOut, Sparkles, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/events', label: 'Events' },
  { to: '/venues', label: 'Venues' },
  { to: '/vendors', label: 'Vendors' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export const Logo = ({ light }: { light?: boolean }) => (
  <Link to="/" className="flex items-center gap-2" aria-label="EventEase home">
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
      <Sparkles size={17} />
    </span>
    <span className={`text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>
      Event<span className="text-primary-500">Ease</span>
    </span>
  </Link>
);

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const dashboardPath = user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'vendor' ? '/vendor/dashboard' : '/dashboard';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Logo />

        <div className="hidden items-center gap-1 lg:flex">
          {publicLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `rounded-lg px-3.5 py-2 text-sm font-semibold transition ${isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <NotificationDropdown />
              <Link
                to={dashboardPath}
                className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:flex"
              >
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                aria-label="Log out"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={19} />
              </button>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700"
              >
                Register
              </Link>
            </div>
          )}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-2 lg:hidden">
          <div className="flex flex-col gap-1">
            {publicLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <Link to="/search" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  <Search size={15} /> Global Search
                </Link>
                <Link to={dashboardPath} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <CalendarCheck size={15} /> Logout
                </button>
              </>
            ) : (
              <div className="mt-2 flex gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700">
                  Login
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-center text-sm font-bold text-white">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export const Footer = () => (
  <footer className="border-t border-slate-200 bg-white">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
      <div className="md:col-span-1">
        <Logo />
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500">
          Discover venues, book trusted vendors, manage your budget, invite guests and organize every detail from one platform.
        </p>
      </div>
      <div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">Platform</h4>
        <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
          <li><Link to="/venues" className="transition hover:text-primary-600">Browse Venues</Link></li>
          <li><Link to="/vendors" className="transition hover:text-primary-600">Find Vendors</Link></li>
          <li><Link to="/events" className="transition hover:text-primary-600">My Events</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">Company</h4>
        <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
          <li><Link to="/about" className="transition hover:text-primary-600">About Us</Link></li>
          <li><Link to="/contact" className="transition hover:text-primary-600">Contact</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">Get Started</h4>
        <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
          <li><Link to="/register" className="transition hover:text-primary-600">Create Account</Link></li>
          <li><Link to="/login" className="transition hover:text-primary-600">Login</Link></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-slate-100 py-5 text-center text-xs text-slate-400">
      © {new Date().getFullYear()} EventEase. All rights reserved.
    </div>
  </footer>
);
