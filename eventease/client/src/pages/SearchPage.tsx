import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, CalendarDays, Building2, Store, ArrowRight } from 'lucide-react';
import { userApi } from '../services/api';
import type { Event, Venue, Vendor } from '../types';
import { LoadingSpinner, Badge, Card, EmptyState } from '../components/ui';
import { EventCard } from '../components/Cards';
import { formatCurrency, debounce } from '../utils/format';

export const SearchPage = () => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<{ events: Event[]; venues: Venue[]; vendors: Vendor[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const runSearch = debounce((value: string) => {
    if (value.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    userApi
      .search(value.trim())
      .then((res) => setResults(res.data.data))
      .catch(() => setResults({ events: [], venues: [], vendors: [] }))
      .finally(() => setLoading(false));
  }, 400);

  const onChange = (value: string) => {
    setQ(value);
    runSearch(value);
  };

  const total = results ? results.events.length + results.venues.length + results.vendors.length : 0;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-extrabold text-slate-900">Search</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">Find your events, venues and vendors — all in one place</p>

      {/* Search bar */}
      <div className="relative mb-8">
        <SearchIcon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="search"
          role="searchbox"
          aria-label="Search events, venues and vendors"
          placeholder="Try 'wedding', 'Mumbai', 'catering'…"
          value={q}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm shadow-card outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
        {loading && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2">
            <span className="block h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </span>
        )}
      </div>

      {!results && !loading && (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
          <SearchIcon size={36} className="mx-auto text-slate-300" />
          <p className="mt-3 font-semibold text-slate-600">Start typing to search</p>
          <p className="mt-1 text-sm text-slate-400">Search matches event names & locations, venue names & cities, and vendor businesses & categories.</p>
        </div>
      )}

      {results && total === 0 && !loading && (
        <EmptyState icon={SearchIcon} title={`No results for "${q}"`} message="Try a different keyword or check the spelling." />
      )}

      {results && total > 0 && (
        <div className="space-y-10">
          {/* Events */}
          {results.events.length > 0 && (
            <section aria-label="Event results">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                <CalendarDays size={15} /> Events ({results.events.length})
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {results.events.map((ev) => <EventCard key={ev._id} event={ev} />)}
              </div>
            </section>
          )}

          {/* Venues */}
          {results.venues.length > 0 && (
            <section aria-label="Venue results">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                <Building2 size={15} /> Venues ({results.venues.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {results.venues.map((v) => (
                  <Link key={v._id} to={`/venues/${v._id}`}>
                    <Card hover className="flex items-center gap-3 p-4">
                      {v.images?.[0] ? (
                        <img src={v.images[0]} alt={v.name} className="h-14 w-14 shrink-0 rounded-lg object-cover" loading="lazy" />
                      ) : (
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-500"><Building2 size={22} /></span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-slate-900">{v.name}</span>
                        <span className="block truncate text-xs text-slate-500">{v.location} · up to {v.capacity.toLocaleString('en-IN')} guests</span>
                        <span className="mt-0.5 block text-sm font-bold text-primary-700">{formatCurrency(v.price)}<span className="text-xs font-normal text-slate-400"> / day</span></span>
                      </span>
                      <ArrowRight size={16} className="shrink-0 text-slate-300" />
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Vendors */}
          {results.vendors.length > 0 && (
            <section aria-label="Vendor results">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                <Store size={15} /> Vendors ({results.vendors.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {results.vendors.map((v) => (
                  <Link key={v._id} to={`/vendors/${v._id}`}>
                    <Card hover className="flex items-center gap-3 p-4">
                      {typeof v.userId === 'object' && v.userId?.profileImage ? (
                        <img src={v.userId.profileImage} alt={v.businessName} className="h-14 w-14 shrink-0 rounded-full object-cover" loading="lazy" />
                      ) : (
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-50 text-lg font-extrabold text-amber-600">
                          {v.businessName.charAt(0)}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-slate-900">{v.businessName}</span>
                        <Badge color="indigo" className="mt-1">{v.category}</Badge>
                      </span>
                      <ArrowRight size={16} className="shrink-0 text-slate-300" />
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
