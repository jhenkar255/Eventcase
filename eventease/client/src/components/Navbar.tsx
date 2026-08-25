import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, CalendarCheck, LogOut, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/venues', label: 'Venues' },
  { to: '/vendors', label: 'Vendors' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

/* Lotus-inspired SVG logo */
const LotusIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C12 2 8 8 8 12C8 14.2 9.8 16 12 16C14.2 16 16 14.2 16 12C16 8 12 2 12 2Z" fill="currentColor" opacity="0.9"/>
    <path d="M12 16C12 16 4 14 4 18C4 20.2 7.6 22 12 22C16.4 22 20 20.2 20 18C20 14 12 16 12 16Z" fill="currentColor" opacity="0.6"/>
    <path d="M12 4C12 4 6 10 6 14C6 16.5 8.7 18 12 18C15.3 18 18 16.5 18 14C18 10 12 4 12 4Z" fill="currentColor" opacity="0.3"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
  </svg>
);

export const Logo = ({ light }: { light?: boolean }) => (
  <Link to="/" className="flex items-center gap-2.5" aria-label="EventEase home">
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-saffron">
      <LotusIcon size={20} />
    </span>
    <div className="flex flex-col">
      <span className={`text-lg font-extrabold tracking-tight leading-none ${light ? 'text-white' : 'text-slate-900'}`}>
        Event<span className="text-primary-600">Ease</span>
      </span>
      <span className={`text-[10px] font-semibold tracking-wider uppercase leading-none ${light ? 'text-primary-200' : 'text-primary-500'}`}>
        Plan. Celebrate. Cherish.
      </span>
    </div>
  </Link>
);

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const dashboardPath = user?.role === 'admin' ? '/admin' : user?.role === 'vendor' ? '/vendor' : '/dashboard';

  return (
    <header className="sticky top-0 z-40 border-b border-saffron-100/50 bg-white/95 backdrop-blur-md">
      {/* Saffron accent strip */}
      <div className="h-1 bg-gradient-to-r from-primary-600 via-gold-400 to-primary-600" />
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Logo />

        <div className="hidden items-center gap-1 lg:flex">
          {publicLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `rounded-lg px-3.5 py-2 text-sm font-semibold transition ${isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-saffron-50 hover:text-primary-700'}`
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
                className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-saffron-50 sm:flex"
              >
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                aria-label="Log out"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <LogOut size={19} />
              </button>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-saffron-50">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-bold text-white shadow-saffron transition hover:from-primary-600 hover:to-primary-700"
              >
                Register Free
              </Link>
            </div>
          )}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-saffron-50 lg:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-saffron-100/50 bg-white px-4 pb-4 pt-2 lg:hidden">
          <div className="flex flex-col gap-1">
            {publicLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-saffron-50'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <Link to="/search" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-saffron-50">
                  <Search size={15} /> Global Search
                </Link>
                <Link to={dashboardPath} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-saffron-50">
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <CalendarCheck size={15} /> Logout
                </button>
              </>
            ) : (
              <div className="mt-2 flex gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700">
                  Login
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2.5 text-center text-sm font-bold text-white">
                  Register Free
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
  <footer className="border-t border-saffron-100/50 bg-slate-900 text-white">
    {/* Decorative garland strip */}
    <div className="h-1.5 bg-gradient-to-r from-primary-600 via-gold-400 to-primary-600" />
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
      <div className="md:col-span-1">
        <Logo light />
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-400">
          India's trusted platform for planning weddings, festivals, corporate events and celebrations of every size.
        </p>
        <div className="mt-4 flex gap-3 text-xs text-slate-500">
          <span>🇮🇳 Made in India</span>
          <span>•</span>
          <span>Supports ₹ INR</span>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-gold-400">Platform</h4>
        <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
          <li><Link to="/venues" className="transition hover:text-gold-300">Browse Venues</Link></li>
          <li><Link to="/vendors" className="transition hover:text-gold-300">Find Vendors</Link></li>
          <li><Link to="/events" className="transition hover:text-gold-300">My Events</Link></li>
          <li><Link to="/search" className="transition hover:text-gold-300">Search</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-gold-400">Event Types</h4>
        <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
          <li><Link to="/vendors?search=Wedding" className="transition hover:text-gold-300">Weddings</Link></li>
          <li><Link to="/vendors?search=Birthday" className="transition hover:text-gold-300">Birthdays</Link></li>
          <li><Link to="/vendors?search=Corporate" className="transition hover:text-gold-300">Corporate Events</Link></li>
          <li><Link to="/vendors?search=Festival" className="transition hover:text-gold-300">Festival Celebrations</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-gold-400">Connect</h4>
        <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
          <li><Link to="/about" className="transition hover:text-gold-300">About Us</Link></li>
          <li><Link to="/contact" className="transition hover:text-gold-300">Contact</Link></li>
          <li><Link to="/register" className="transition hover:text-gold-300">Become a Vendor</Link></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">
      © {new Date().getFullYear()} EventEase. All rights reserved. 🪷
    </div>
  </footer>
);
