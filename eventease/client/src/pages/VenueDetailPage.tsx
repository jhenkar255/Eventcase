import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Users, Star, IndianRupee, CalendarX2, Check, ChevronLeft,
  ShieldCheck, Phone, Navigation,
} from 'lucide-react';
import { venueApi, reviewApi, getErrorMessage } from '../services/api';
import type { Venue, Review } from '../types';
import { ReviewCard } from '../components/ReviewCard';
import { BookingModal } from '../components/BookingModal';
import { Button, LoadingSpinner, ErrorBanner, EmptyState, RatingStars, Badge } from '../components/ui';
import { formatCurrency, formatDate } from '../utils/format';

export const VenueDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [booking, setBooking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([venueApi.get(id), venueApi.availability(id).catch(() => null)])
      .then(([v, av]) => {
        setVenue(v.data.data.venue as Venue);
        setReviews((v.data.data.reviews ?? []) as Review[]);
        if (av?.data?.data?.bookedDates) setBookedDates(av.data.data.bookedDates);
        window.scrollTo(0, 0);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner full label="Loading venue…" />;
  if (error || !venue)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorBanner message={error || 'Venue not found'} />
        <Link to="/venues" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline">
          <ChevronLeft size={15} /> Back to venues
        </Link>
      </div>
    );

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/venues" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-800">
        <ChevronLeft size={15} /> Back to venues
      </Link>

      {/* Gallery */}
      <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
        <img
          src={venue.images[0]}
          alt={venue.name}
          className="h-72 w-full rounded-xl object-cover shadow-card sm:h-96"
          loading="lazy"
        />
        <div className="grid grid-cols-3 gap-3 md:grid-cols-1">
          {venue.images.slice(1, 4).map((img, i) => (
            <button key={i} onClick={() => setActiveImg(i + 1)} className="overflow-hidden rounded-xl" aria-label={`View photo ${i + 2}`}>
              <img src={img} alt={`${venue.name} view ${i + 2}`} loading="lazy" className={`h-full max-h-[120px] w-full object-cover transition ${activeImg === i + 1 ? 'ring-2 ring-primary-500' : 'hover:opacity-90'}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{venue.name}</h1>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin size={15} /> {venue.address || venue.location}
              </p>
            </div>
            <Badge color="green"><ShieldCheck size={13} /> Verified venue</Badge>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <RatingStars rating={venue.rating} size={16} showValue />
            <span className="text-slate-400">·</span>
            <span className="font-medium text-slate-600">{venue.reviewCount} reviews</span>
            <span className="text-slate-400">·</span>
            <span className="flex items-center gap-1.5 font-medium text-slate-600"><Users size={15} /> Up to {venue.capacity.toLocaleString('en-IN')} guests</span>
          </div>

          {venue.description && (
            <div className="mt-6">
              <h2 className="text-lg font-bold text-slate-900">About this venue</h2>
              <p className="mt-2 leading-relaxed text-slate-600">{venue.description}</p>
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-lg font-bold text-slate-900">Facilities</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {venue.facilities.map((f) => (
                <span key={f} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                  <Check size={14} className="text-emerald-500" /> {f}
                </span>
              ))}
            </div>
          </div>

          {/* Map */}
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            <iframe
              title={`Map of ${venue.name}`}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=77.0%2C12.7%2C78.2%2C13.4&layer=mapnik`}
              className="h-56 w-full border-0"
              loading="lazy"
            />
            <a
              href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(venue.location)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-white px-4 py-3 text-sm font-semibold text-primary-600 transition hover:bg-slate-50"
            >
              <Navigation size={15} /> Open location in maps — {venue.location}
            </a>
          </div>

          {/* Reviews */}
          <div className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">Reviews ({venue.reviewCount})</h2>
            {reviews.length > 0 && (
              <div className="mt-4 card-base p-5">
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                  <div className="text-center">
                    <p className="text-4xl font-extrabold text-slate-900">{venue.rating.toFixed(1)}</p>
                    <RatingStars rating={venue.rating} size={15} />
                    <p className="mt-1 text-xs text-slate-400">{venue.reviewCount} reviews</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {distribution.map((d) => (
                      <div key={d.star} className="flex items-center gap-2 text-xs">
                        <span className="w-10 shrink-0 font-semibold text-slate-600">{d.star} ★</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-amber-400" style={{ width: `${d.pct}%` }} />
                        </div>
                        <span className="w-9 shrink-0 text-right text-slate-500">{d.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4 space-y-4">
              {reviews.slice(0, 8).map((r) => (
                <ReviewCard key={r._id} review={r} />
              ))}
              {reviews.length === 0 && (
                <EmptyState title="No reviews yet" message="Be the first to book and share your experience." icon={Star} />
              )}
            </div>
          </div>
        </div>

        {/* Booking sidebar */}
        <aside>
          <div className="card-base sticky top-24 p-6">
            <p className="text-sm text-slate-500">Starting from</p>
            <p className="mt-1 flex items-center text-3xl font-extrabold text-slate-900">
              <IndianRupee size={24} strokeWidth={2.5} />{venue.price.toLocaleString('en-IN')}
              <span className="ml-1 text-sm font-medium text-slate-400">/ day</span>
            </p>

            <Button fullWidth size="lg" className="mt-5" onClick={() => setBooking(true)}>
              Book Venue
            </Button>
            <p className="mt-3 text-center text-xs text-slate-400">No advance needed — pay after confirmation</p>

            <div className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm">
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Capacity</span>
                <span className="font-bold text-slate-800">{venue.capacity.toLocaleString('en-IN')} guests</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Location</span>
                <span className="font-bold text-slate-800">{venue.location}</span>
              </p>
            </div>

            {bookedDates.length > 0 && (
              <div className="mt-5 border-t border-slate-100 pt-5">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                  <CalendarX2 size={15} className="text-red-500" /> Unavailable dates (next 6 months)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {bookedDates.slice(0, 8).map((d) => (
                    <span key={d} className="rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 line-through decoration-red-300">
                      {formatDate(d)}
                    </span>
                  ))}
                  {bookedDates.length > 8 && <span className="px-1 py-1 text-xs text-slate-400">+{bookedDates.length - 8} more</span>}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      <BookingModal open={booking} onClose={() => setBooking(false)} kind="venue" targetId={venue._id} targetName={venue.name} />
    </div>
  );
};
