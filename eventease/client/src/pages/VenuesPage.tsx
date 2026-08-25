import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, SlidersHorizontal, X } from 'lucide-react';
import { venueApi, getErrorMessage } from '../services/api';
import type { Venue } from '../types';
import { EmptyState, LoadingSpinner, ErrorBanner, Pagination, Button, Input, Select, RatingStars } from '../components/ui';
import { VenueCard } from '../components/Cards';
import { VENUE_FACILITIES, INDIAN_CITIES } from '../utils/constants';

export const VenuesPage = () => {
  const [params, setParams] = useSearchParams();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filters = useMemo(
    () => ({
      location: params.get('location') ?? '',
      capacity: params.get('capacity') ?? '',
      minPrice: params.get('minPrice') ?? '',
      maxPrice: params.get('maxPrice') ?? '',
      minRating: params.get('minRating') ?? '',
      facilities: params.get('facilities') ?? '',
      sort: params.get('sort') ?? 'rating',
      page: Number(params.get('page')) || 1,
    }),
    [params]
  );

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  useEffect(() => {
    setLoading(true);
    setError('');
    venueApi
      .list({ ...filters, limit: 9 })
      .then((res) => {
        const d = res.data.data;
        setVenues(d.venues as Venue[]);
        setTotal(d.total as number);
        setPages(d.pages as number);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [filters]);

  const selectedFacilities = filters.facilities ? filters.facilities.split(',') : [];
  const activeCount =
    (filters.location ? 1 : 0) + (filters.capacity ? 1 : 0) + (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.minRating ? 1 : 0) + selectedFacilities.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Browse Venues</h1>
        <p className="mt-1 text-sm text-slate-500">{loading ? 'Searching…' : `${total} venues found`}</p>
      </div>

      {/* Search bar */}
      <div className="card-base mb-6 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            id="venue-search-location"
            label="Location"
            placeholder="Search city…"
            list="city-list"
            value={filters.location}
            onChange={(e) => setFilter('location', e.target.value)}
          />
          <datalist id="city-list">
            {INDIAN_CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <Input id="venue-capacity" label="Min guests" type="number" min={1} placeholder="e.g. 200" value={filters.capacity} onChange={(e) => setFilter('capacity', e.target.value)} />
          <Select
            id="venue-sort"
            label="Sort by"
            options={[
              { value: 'rating', label: 'Top rated' },
              { value: 'price_asc', label: 'Price: low to high' },
              { value: 'price_desc', label: 'Price: high to low' },
              { value: 'capacity', label: 'Largest capacity' },
              { value: 'newest', label: 'Newest' },
            ]}
            value={filters.sort}
            onChange={(e) => setFilter('sort', e.target.value)}
          />
          <div className="flex items-end gap-2">
            <Button variant="outline" className="flex-1 lg:hidden" onClick={() => setShowFilters((s) => !s)}>
              <SlidersHorizontal size={16} /> Filters {activeCount > 0 && `(${activeCount})`}
            </Button>
            {(activeCount > 0) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setParams(new URLSearchParams(filters.sort !== 'rating' ? { sort: filters.sort } : {}));
                }}
                aria-label="Clear all filters"
              >
                <X size={16} /> Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Filters panel */}
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
          <div className="card-base sticky top-24 space-y-5 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Filters</h2>

            <div>
              <p className="label-base">Price range (₹/day)</p>
              <div className="flex gap-2">
                <Input id="vp-min" placeholder="Min" type="number" min={0} value={filters.minPrice} onChange={(e) => setFilter('minPrice', e.target.value)} />
                <Input id="vp-max" placeholder="Max" type="number" min={0} value={filters.maxPrice} onChange={(e) => setFilter('maxPrice', e.target.value)} />
              </div>
            </div>

            <div>
              <p className="label-base">Minimum rating</p>
              <div className="space-y-2">
                {[4, 3, 0].map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilter('minRating', r === 0 ? '' : String(r))}
                    className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                      (r === 0 && !filters.minRating) || String(r) === filters.minRating
                        ? 'border-primary-400 bg-primary-50 font-semibold text-primary-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {r === 0 ? (
                      'Any rating'
                    ) : (
                      <>
                        <RatingStars rating={r} size={13} /> {r}+ stars
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="label-base">Facilities</p>
              <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                {VENUE_FACILITIES.map((f) => (
                  <label key={f} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      checked={selectedFacilities.includes(f)}
                      onChange={(e) => {
                        const next = e.target.checked ? [...selectedFacilities, f] : selectedFacilities.filter((x) => x !== f);
                        setFilter('facilities', next.join(','));
                      }}
                    />
                    {f}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div>
          {error ? (
            <ErrorBanner message={error} onRetry={() => setFilter('page', String(filters.page))} />
          ) : loading ? (
            <LoadingSpinner full label="Finding venues…" />
          ) : venues.length === 0 ? (
            <EmptyState icon={Building2} title="No venues match your filters" message="Try widening your search — adjust price range, capacity or location." />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {venues.map((v) => (
                  <VenueCard key={v._id} venue={v} />
                ))}
              </div>
              <Pagination page={filters.page} pages={pages} onChange={(p) => { setFilter('page', String(p)); window.scrollTo({ top: 0 }); }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
