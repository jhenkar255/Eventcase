import { useState } from 'react';
import { Star } from 'lucide-react';
import { reviewApi, getErrorMessage } from '../services/api';
import { Modal, Button, Textarea } from './ui';
import { useToast } from '../context/ToastContext';

interface Props {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  targetName: string;
  onSubmitted: () => void;
}

export const ReviewModal = ({ open, onClose, bookingId, targetName, onSubmitted }: Props) => {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (comment.trim().length < 10) return setError('Please write at least 10 characters.');
    setSaving(true);
    setError('');
    try {
      await reviewApi.create({ bookingId, rating, comment });
      toast('success', 'Review published — thank you!');
      setDone(true);
      setTimeout(() => {
        onSubmitted();
        onClose();
        setDone(false); setComment(''); setRating(5);
      }, 1600);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Review ${targetName}`}>
      {done ? (
        <div className="py-8 text-center">
          <p className="text-lg font-extrabold text-slate-900">Thank you!</p>
          <p className="mt-1 text-sm text-slate-500">Your review has been published.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{error}</div>}
          <div>
            <p className="label-base">Your rating</p>
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={rating === i}
                  aria-label={`${i} star${i > 1 ? 's' : ''}`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(i)}
                  className="rounded p-0.5 transition hover:scale-110"
                >
                  <Star size={30} fill={(hover || rating) >= i ? '#f59e0b' : 'none'} className={(hover || rating) >= i ? 'text-amber-500' : 'text-slate-300'} />
                </button>
              ))}
            </div>
          </div>
          <Textarea
            id="review-comment"
            label="Your experience"
            required
            placeholder="Share details about the service quality, punctuality and professionalism…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            hint={`${comment.length}/2000 — minimum 10 characters`}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={submit} loading={saving}>Publish review</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
