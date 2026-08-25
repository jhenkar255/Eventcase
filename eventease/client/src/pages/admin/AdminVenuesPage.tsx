import { useEffect, useState, useCallback } from 'react';
import { Building2, Trash2, MapPin } from 'lucide-react';
import { venueApi, getErrorMessage } from '../../services/api';
import type { Venue } from '../../types';
import { Button, Badge, LoadingSpinner, EmptyState, ErrorBanner, Pagination, ConfirmDialog, Card } from '../../components/ui';
import { RatingStars } from '../../components/ui/States';
import { formatCurrency } from '../../utils/format';

export const AdminVenuesPage = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Venue | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    venueApi
      .list({ page, limit: 12 })
      .then((res) => {
        const d = res.data.data;
        setVenues(d.venues as Venue[]);
        setPages(d.pages as number);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(load, [load]);

  const remove = async () => {
    if (!deleteTarget) return;
    await venueApi.remove(deleteTarget._id).catch((err) => setError(getErrorMessage(err)));
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-slate-900">Venues</h1>
        <p className="mt-1 text-sm text-slate-500">All venue listings on the platform</p>
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} onRetry={load} /></div>}

      {loading ? (
        <LoadingSpinner full label="Loading venues…" />
      ) : venues.length === 0 ? (
        <EmptyState icon={Building2} title="No venues" message="Venue listings will appear here." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => (
              <Card key={v._id} hover className="overflow-hidden p-0">
                <div className="relative h-36 bg-slate-100">
                  {v.images?.[0] ? (
                    <img src={v.images[0]} alt={v.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300"><Building2 size={34} /></div>
                  )}
                  <Badge color="blue" className="absolute left-3 top-3 shadow">Up to {v.capacity.toLocaleString("en-IN")}</Badge>
                </div>
                <div className="p-4">
                  <h3 className="truncate font-bold text-slate-900">{v.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400"><MapPin size={11} />{v.location}</p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <RatingStars rating={v.rating} size={13} />
                    <span className="font-bold text-primary-700">{formatCurrency(v.price)}</span>
                  </div>
                  <Button size="sm" variant="ghost" className="mt-3 w-full !text-red-500 hover:!bg-red-50" onClick={() => setDeleteTarget(v)}>
                    <Trash2 size={14} /> Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this venue?"
        message={`"${deleteTarget?.name}" will be permanently removed along with its bookings.`}
        confirmLabel="Delete forever"
        danger
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
