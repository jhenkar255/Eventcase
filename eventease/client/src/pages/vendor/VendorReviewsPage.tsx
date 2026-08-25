import { useEffect, useState, useCallback } from 'react';
import { Star, MessageSquareReply } from 'lucide-react';
import { reviewApi, vendorApi, getErrorMessage } from '../../services/api';
import type { Review as ReviewType, Vendor } from '../../types';
import { LoadingSpinner, EmptyState, ErrorBanner, Button, Modal, Textarea, Card, Pagination } from '../../components/ui';
import { ReviewCard } from '../../components/ReviewCard';

export const VendorReviewsPage = () => {
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyTarget, setReplyTarget] = useState<ReviewType | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState('');
  const [savingReply, setSavingReply] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    vendorApi
      .myProfile()
      .then((vRes) => {
        const vendor = (vRes.data.data as { vendor?: Vendor } | null)?.vendor ?? null;
        if (!vendor) {
          setReviews([]);
          return;
        }
        return reviewApi.list({ vendorId: vendor._id, page, limit: 10 }).then((res) => {
          const d = res.data.data;
          setReviews(d.reviews as ReviewType[]);
          setPages(d.pages ?? 1);
        });
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(load, [load]);

  const openReply = (r: ReviewType) => {
    setReplyTarget(r);
    setReplyText(r.response ?? '');
    setReplyError('');
  };

  const saveReply = async () => {
    if (!replyTarget) return;
    if (replyText.trim().length < 3) return setReplyError('Reply must be at least 3 characters.');
    setSavingReply(true); setReplyError('');
    try {
      await vendorApi.respondToReview(replyTarget._id, replyText);
      setReplyTarget(null);
      load();
    } catch (err) {
      setReplyError(getErrorMessage(err));
    } finally {
      setSavingReply(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900">My Reviews</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">What customers say about your business</p>

      {error && <div className="mb-4"><ErrorBanner message={error} onRetry={load} /></div>}

      {loading ? (
        <LoadingSpinner full label="Loading reviews…" />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          message="Once you complete bookings and customers leave reviews, they'll show up here."
        />
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r._id}>
                <ReviewCard review={r} />
                {!r.response && (
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => openReply(r)}>
                    <MessageSquareReply size={13} /> Reply
                  </Button>
                )}
              </div>
            ))}
          </div>
          {pages > 1 && <Pagination page={page} pages={pages} onChange={setPage} />}
        </>
      )}

      <Modal open={!!replyTarget} onClose={() => setReplyTarget(null)} title="Reply to review">
        <div className="space-y-4">
          {replyError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{replyError}</div>}
          {replyTarget && (
            <Card className="bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">
                {(typeof replyTarget.customerId === 'object' ? replyTarget.customerId?.name : '') || 'Customer'} · {'★'.repeat(replyTarget.rating)}
              </p>
              <p className="mt-1 line-clamp-3 text-sm text-slate-700">{replyTarget.comment}</p>
            </Card>
          )}
          <Textarea id="reply-text" label="Your public reply" required rows={4} placeholder="Thank the customer or address their concern…" value={replyText} onChange={(e) => setReplyText(e.target.value)} hint={`${replyText.length}/500`} />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setReplyTarget(null)}>Cancel</Button>
            <Button onClick={saveReply} loading={savingReply}>Post reply</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
