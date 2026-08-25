import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Store, SlidersHorizontal, X } from 'lucide-react';
import { vendorApi, getErrorMessage } from '../services/api';
import type { Vendor } from '../types';
import { VendorCard } from '../components/Cards';
import { EmptyState, LoadingSpinner, ErrorBanner, Pagination, Button, Input, Select } from '../components/ui';
import { VENDOR_CATEGORIES, INDIAN_CITIES } from '../utils/constants';

export const VendorsPage = () => {
  const [params, setParams] = useSearchParams();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState(params.get('search') ?? '');
  const [showFilters, setShowFilters] = useState(false);

  const filters = useMemo(
    () => ({
      search: params.get('search') ?? '',
      category: params.get('category') ?? '',
      location: params.get('location') ?? '',
      minPrice: params.get('minPrice') ?? '',
      maxPrice: params.get('maxPrice') ?? '',
      minRating: params.get('minRating') ?? '',
      sort: params.get('sort') ?? 'rating',
      page: Number(params.get('page')) || 1,
    }),
    [params]
  );

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== filters.search) setFilter('search', searchInput);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

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
    vendorApi
      .list({ ...filters, limit: 8 })
      .then((res) => {
        const d = res.data.data;
        setVendors(d.vendors as Vendor[]);
        setTotal(d.total as number);
        setPages(d.pages as number);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [filters]);

  const activeCount =
    (filters.category ? 1 : 0) + (filters.location ? 1 : 0) + (filters.minPrice || filters.maxPrice ? 1 : 0) + (filters.minRating ? 1 : 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Find Vendors</h1>
        <p className="mt-1 text-sm text-slate-500">{loading ? 'Searching…' : `${total} verified vendors`}</p>
      </div>

      <div className="card-base mb-6 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Input
              id="vendor-search"
              label="Search"
              placeholder="Search by name, category or keyword…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoComplete="off"
            />
          </div>
          <Select
            id="vendor-cat"
            label="Category"
            options={VENDOR_CATEGORIES.map((c) => ({ value: c, label: c }))}
            placeholder="All categories"
            value={filters.category}
            onChange={(e) => setFilter('category', e.target.value)}
          />
          <div className="flex items-end gap-2">
            <Button variant="outline" className="flex-1 lg:hidden" onClick={() => setShowFilters((s) => !s)}>
              <SlidersHorizontal size={16} /> Filters {activeCount > 0 && `(${activeCount})`}
            </Button>
            {activeCount > 0 && (
              <Button variant="ghost" onClick={() => { setParams(new URLSearchParams(filters.search ? { search: filters.search } : {})); setSearchInput(filters.search); }} aria-label="Clear filters">
                <X size={16} /> Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
          <div className="card-base sticky top-24 space-y-5 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Filters</h2>
            <Input
              id="vendor-location"
              label="Location"
              placeholder="City"
              list="vendor-city-list"
              value={filters.location}
              onChange={(e) => setFilter('location', e.target.value)}
            />
            <datalist id="vendor-city-list">
              {INDIAN_CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <div>
              <p className="label-base">Starting price (₹)</p>
              <div className="flex gap-2">
                <Input id="vd-min" placeholder="Min" type="number" min={0} value={filters.minPrice} onChange={(e) => setFilter('minPrice', e.target.value)} />
                <Input id="vd-max" placeholder="Max" type="number" min={0} value={filters.maxPrice} onChange={(e) => setFilter('maxPrice', e.target.value)} />
              </div>
            </div>
            <div>
              <p className="label-base">Minimum rating</p>
              <div className="flex flex-wrap gap-2">
                {[4, 3].map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilter('minRating', String(r) === filters.minRating ? '' : String(r))}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      String(r) === filters.minRating ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ★ {r}+
                  </button>
                ))}
              </div>
            </div>
            <Select
              id="vendor-sort"
              label="Sort by"
              options={[
                { value: 'rating', label: 'Top rated' },
                { value: 'price_asc', label: 'Price: low to high' },
                { value: 'price_desc', label: 'Price: high to low' },
                { value: 'newest', label: 'Newest' },
              ]}
              value={filters.sort}
              onChange={(e) => setFilter('sort', e.target.value)}
            />
          </div>
        </aside>

        <div>
          {error ? (
            <ErrorBanner message={error} />
          ) : loading ? (
            <LoadingSpinner full label="Finding vendors…" />
          ) : vendors.length === 0 ? (
            <EmptyState icon={Store} title="No vendors found" message="Try a different category, city or clear your filters." />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {vendors.map((v) => (
                  <VendorCard key={v._id} vendor={v} />
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
