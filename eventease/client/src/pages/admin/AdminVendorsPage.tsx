import { useEffect, useState, useCallback } from 'react';
import { Store, Check, X, MapPin } from 'lucide-react';
import { adminApi, getErrorMessage } from '../../services/api';
import type { Vendor } from '../../types';
import {
  Button, Badge, LoadingSpinner, EmptyState, ErrorBanner,
  Pagination, Select, ConfirmDialog, Card,
} from '../../components/ui';
import { RatingStars } from '../../components/ui/States';
import { formatCurrency } from '../../utils/format';

export const AdminVendorsPage = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionTarget, setActionTarget] = useState<{ vendor: Vendor; action: 'approve' | 'reject' } | null>(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    adminApi
      .vendors({ page, limit: 10, ...(statusFilter ? { verificationStatus: statusFilter } : {}) })
      .then((res) => {
        const d = res.data.data;
        setVendors(d.vendors as Vendor[]);
        setPages(d.pages as number);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(load, [load]);

  const act = async () => {
    if (!actionTarget) return;
    setActing(true);
    try {
      await adminApi.verifyVendor(actionTarget.vendor._id, actionTarget.action === 'approve' ? 'approved' : 'rejected');
      setActionTarget(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
      setActionTarget(null);
    } finally {
      setActing(false);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Vendors</h1>
          <p className="mt-1 text-sm text-slate-500">Approve new vendors and manage listings</p>
        </div>
        <select aria-label="Filter by approval status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-base max-w-[200px]">
          <option value="">All statuses</option>
          <option value="pending">Pending approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} onRetry={load} /></div>}

      {loading ? (
        <LoadingSpinner full label="Loading vendors…" />
      ) : vendors.length === 0 ? (
        <EmptyState icon={Store} title="No vendors found" message={statusFilter ? `No ${statusFilter} vendors.` : 'Vendor registrations will appear here.'} />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {vendors.map((v) => (
              <Card key={v._id} className={`p-5 ${v.verificationStatus === 'pending' ? 'ring-2 ring-amber-300' : ''}`}>
                <div className="flex items-start gap-3">
                  {typeof v.userId === 'object' && v.userId.profileImage ? (
                    <img src={v.userId.profileImage} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" loading="lazy" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 font-extrabold text-amber-600">
                      {v.businessName.charAt(0)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900">{v.businessName}</h3>
                      <Badge color={v.verificationStatus === 'approved' ? 'green' : v.verificationStatus === 'rejected' ? 'red' : 'amber'}>
                        {v.verificationStatus}
                      </Badge>
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
                      <span><Badge color="indigo" className="mr-1">{v.category}</Badge></span>
                      <span className="flex items-center gap-1"><MapPin size={11} />{v.location}</span>
                      <span>from {formatCurrency(v.startingPrice)}</span>
                    </p>
                    {v.description && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{v.description}</p>}
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                      <RatingStars rating={v.rating} size={13} />
                      <span>({v.reviewCount})</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  {v.verificationStatus === 'pending' && (
                    <>
                      <Button size="sm" variant="success" onClick={() => setActionTarget({ vendor: v, action: 'approve' })}>
                        <Check size={14} /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="!text-red-600 hover:!border-red-300 hover:!bg-red-50" onClick={() => setActionTarget({ vendor: v, action: 'reject' })}>
                        <X size={14} /> Reject
                      </Button>
                    </>
                  )}
                  {v.verificationStatus === 'rejected' && (
                    <Button size="sm" variant="success" onClick={() => setActionTarget({ vendor: v, action: 'approve' })}>
                      <Check size={14} /> Approve anyway
                    </Button>
                  )}
                  {v.verificationStatus === 'approved' && (
                    <p className="text-xs font-medium text-emerald-600">✓ Live and visible to customers</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={!!actionTarget}
        title={actionTarget?.action === 'approve' ? 'Approve this vendor?' : 'Reject this vendor?'}
        message={
          actionTarget?.action === 'approve'
            ? `${actionTarget.vendor.businessName} will become visible in search results and can receive bookings.`
            : `${actionTarget?.vendor.businessName} will be hidden from customers and marked rejected.`
        }
        confirmLabel={actionTarget?.action === 'approve' ? 'Approve' : 'Reject'}
        danger={actionTarget?.action === 'reject'}
        loading={acting}
        onConfirm={act}
        onCancel={() => setActionTarget(null)}
      />
    </div>
  );
};
