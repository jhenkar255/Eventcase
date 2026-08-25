import { useEffect, useState, useCallback } from 'react';
import { Star } from 'lucide-react';
import { adminApi, reviewApi, getErrorMessage } from '../../services/api';
import type { Review as ReviewType } from '../../types';
import { LoadingSpinner, EmptyState, ErrorBanner, Button, ConfirmDialog, Pagination } from '../../components/ui';
import { ReviewCard } from '../../components/ReviewCard';

export const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ReviewType | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    adminApi
      .reviews({ page, limit: 10 })
      .then((res) => {
        const d = res.data.data;
        setReviews(d.reviews as ReviewType[]);
        setPages(d.pages as number);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(load, [load]);

  const remove = async () => {
    if (!deleteTarget) return;
    await reviewApi.remove(deleteTarget._id).catch((err) => setError(getErrorMessage(err)));
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-slate-900">Review Moderation</h1>
        <p className="mt-1 text-sm text-slate-500">Monitor and moderate customer reviews</p>
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} onRetry={load} /></div>}

      {loading ? (
        <LoadingSpinner full label="Loading reviews…" />
      ) : reviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" message="Customer reviews will appear here for moderation." />
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r._id} className="relative">
                <ReviewCard review={r} />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-3 top-3 !text-red-500 hover:!bg-red-50"
                  onClick={() => setDeleteTarget(r)}
                  title="Delete review"
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this review?"
        message="The review will be permanently removed and vendor ratings recalculated."
        confirmLabel="Delete review"
        danger
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
