import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, ChevronLeft, BadgeCheck, Phone, Mail, Camera,
  Clock, CalendarDays, Star, IndianRupee,
} from 'lucide-react';
import { vendorApi, getErrorMessage } from '../services/api';
import type { Vendor, Service, Review } from '../types';
import { ReviewCard } from '../components/ReviewCard';
import { BookingModal } from '../components/BookingModal';
import { Button, LoadingSpinner, ErrorBanner, EmptyState, RatingStars, Badge, Modal } from '../components/ui';
import { formatCurrency } from '../utils/format';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const VendorDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookingService, setBookingService] = useState<Service | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    vendorApi
      .get(id)
      .then((res) => {
        setVendor(res.data.data.vendor as Vendor);
        setServices(res.data.data.services as Service[]);
        setReviews(res.data.data.reviews as Review[]);
        window.scrollTo(0, 0);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner full label="Loading vendor…" />;
  if (error || !vendor)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorBanner message={error || 'Vendor not found'} />
        <Link to="/vendors" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline">
          <ChevronLeft size={15} /> Back to vendors
        </Link>
      </div>
    );

  const openBooking = (svc: Service | null) => {
    setBookingService(svc);
    setBookingOpen(true);
  };

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    pct: reviews.length ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/vendors" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-800">
        <ChevronLeft size={15} /> Back to vendors
      </Link>

      {/* Header */}
      <div className="card-base overflow-hidden">
        <div className="h-40 bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 sm:h-48" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              {vendor.profileImage ? (
                <img src={vendor.profileImage} alt={vendor.businessName} className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-card" loading="lazy" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-primary-100 text-2xl font-extrabold text-primary-700">
                  {vendor.businessName.charAt(0)}
                </div>
              )}
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-slate-900">{vendor.businessName}</h1>
                  {vendor.verified && (
                    <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                      <BadgeCheck size={14} /> Verified
                    </span>
                  )}
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><MapPin size={14} /> {vendor.location || 'India'}</span>
                  <Badge color="purple">{vendor.category}</Badge>
                </p>
              </div>
            </div>
            <Button size="lg" onClick={() => openBooking(null)}>Book Vendor</Button>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm">
            <RatingStars rating={vendor.rating} size={16} showValue />
            <span className="text-slate-400">·</span>
            <span className="font-medium text-slate-600">{vendor.reviewCount} reviews</span>
            <span className="text-slate-400">·</span>
            <span className="font-medium text-slate-600">Starting at {formatCurrency(vendor.startingPrice)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Main */}
        <div className="space-y-8">
          {vendor.description && (
            <section>
              <h2 className="text-lg font-bold text-slate-900">About</h2>
              <p className="mt-2 leading-relaxed text-slate-600">{vendor.description}</p>
            </section>
          )}

          {/* Portfolio */}
          {vendor.portfolio.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Camera size={18} className="text-primary-500" /> Portfolio</h2>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {vendor.portfolio.map((p, i) => (
                  <button key={i} onClick={() => setLightboxImg(p)} aria-label={`Open portfolio image ${i + 1}`} className="group overflow-hidden rounded-xl">
                    <img src={p} alt={`${vendor.businessName} work ${i + 1}`} loading="lazy" className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Services */}
          <section>
            <h2 className="text-lg font-bold text-slate-900">Services & pricing</h2>
            {services.length === 0 ? (
              <EmptyState title="No services listed yet" message="This vendor hasn't added services. Use the Book Vendor button for a custom quote." />
            ) : (
              <div className="mt-3 space-y-3">
                {services.map((s) => (
                  <div key={s._id} className="card-base flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">{s.name}</p>
                      {s.description && <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{s.description}</p>}
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span>{s.pricingType === 'Per Person' ? `₹${s.price.toLocaleString('en-IN')} / guest` : s.pricingType === 'Per Hour' ? `₹${s.price.toLocaleString('en-IN')} / hour` : formatCurrency(s.price)}</span>
                        {s.duration && <span className="flex items-center gap-1"><Clock size={11} /> {s.duration}</span>}
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => openBooking(s)}>
                      Book this service
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Reviews */}
          <section>
            <h2 className="text-lg font-bold text-slate-900">Reviews ({vendor.reviewCount})</h2>
            {reviews.length > 0 && (
              <div className="card-base mt-3 p-5">
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                  <div className="text-center">
                    <p className="text-4xl font-extrabold text-slate-900">{vendor.rating.toFixed(1)}</p>
                    <RatingStars rating={vendor.rating} size={15} />
                    <p className="mt-1 text-xs text-slate-400">{vendor.reviewCount} reviews</p>
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
              {reviews.slice(0, 10).map((r) => (
                <ReviewCard key={r._id} review={r} />
              ))}
              {reviews.length === 0 && <EmptyState icon={Star} title="No reviews yet" message="Book this vendor and be the first to review." />}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside>
          <div className="card-base sticky top-24 space-y-5 p-6">
            <div>
              <p className="text-sm text-slate-500">Starting price</p>
              <p className="mt-1 flex items-baseline text-3xl font-extrabold text-slate-900">
                <IndianRupee size={22} strokeWidth={2.5} />
                {vendor.startingPrice.toLocaleString('en-IN')}
              </p>
            </div>
            <Button fullWidth size="lg" onClick={() => openBooking(null)}>Book Vendor</Button>

            <div className="space-y-3 border-t border-slate-100 pt-5 text-sm">
              {vendor.phone && (
                <p className="flex items-center gap-2.5 text-slate-600"><Phone size={15} className="text-primary-500" /> {vendor.phone}</p>
              )}
              {vendor.email && (
                <p className="flex items-center gap-2.5 break-all text-slate-600"><Mail size={15} className="shrink-0 text-primary-500" /> {vendor.email}</p>
              )}
            </div>

            <div className="border-t border-slate-100 pt-5">
              <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                <CalendarDays size={15} className="text-primary-500" /> Weekly availability
              </p>
              <div className="space-y-1.5">
                {(vendor as unknown as { availability?: Array<{ day: string; open: boolean; from: string; to: string }> }).availability?.map((a) => (
                  <p key={a.day} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">{a.day}</span>
                    {a.open ? (
                      <span className="text-emerald-600">{a.from} – {a.to}</span>
                    ) : (
                      <span className="text-red-400">Closed</span>
                    )}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Lightbox */}
      <Modal open={!!lightboxImg} onClose={() => setLightboxImg('')} title="Portfolio image" wide>
        {lightboxImg && <img src={lightboxImg} alt="Portfolio" className="w-full rounded-lg" />}
      </Modal>

      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} kind="vendor" targetId={vendor._id} targetName={vendor.businessName} service={bookingService} />
    </div>
  );
};
