import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, MapPin, Star, ChevronLeft, IndianRupee } from 'lucide-react';
import { userApi, eventApi, getErrorMessage } from '../../services/api';
import type { Event, Recommendations as RecData, Venue, Vendor, Service } from '../../types';
import { LoadingSpinner, ErrorBanner, Badge, Card, EmptyState, Button } from '../../components/ui';
import { formatCurrency } from '../../utils/format';

export const RecommendationsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [recs, setRecs] = useState<RecData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    window.scrollTo(0, 0);
    eventApi
      .get(id)
      .then(async (res) => {
        const ev = res.data.data.event as Event;
        setEvent(ev);
        const r = await userApi.recommendations({
          eventType: ev.type,
          location: ev.location,
          guestCount: ev.guestCount,
          budget: ev.budget,
        });
        setRecs(r.data.data as RecData);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner full label="Finding the best matches…" />;
  if (error || !event)
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorBanner message={error || 'Event not found'} />
        <Link to={`/events/${id}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline">
          <ChevronLeft size={15} /> Back to event
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl">
      <Link to={`/events/${event._id}`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-800">
        <ChevronLeft size={15} /> {event.name}
      </Link>

      {/* Header */}
      <div className="card-base mb-8 bg-gradient-to-r from-primary-600 to-indigo-600 p-6 text-white">
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary-100">
          <Sparkles size={16} /> Smart recommendations
        </p>
        <h1 className="mt-2 text-2xl font-extrabold">Matched for your {event.type.toLowerCase()}</h1>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-primary-50">
          <span>📍 {event.location}</span>
          <span>👥 {event.guestCount.toLocaleString('en-IN')} guests</span>
          <span>💰 {formatCurrency(event.budget)} budget</span>
        </div>
        <p className="mt-3 max-w-xl text-xs text-primary-100/90">
          Ranked by rating, price fit for your budget, city match and popularity.
        </p>
      </div>

      {!recs ? (
        <EmptyState icon={Sparkles} title="No recommendations available" message="Try updating your event details." />
      ) : (
        <div className="space-y-10">
          {/* Venues */}
          <section aria-label="Recommended venues">
            <SectionHeader title="Venues that fit your guest list" count={recs.venues.length} />
            {recs.venues.length === 0 ? (
              <p className="text-sm text-slate-400">No venue matches right now.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recs.venues.map((v) => {
                  const venue = v.item as unknown as Venue;
                  return (
                    <Card key={v.id} hover className="flex flex-col p-5">
                      <MatchScore score={v.matchScore} />
                      <h3 className="mt-2 font-bold text-slate-900">{venue.name}</h3>
                      <ul className="mt-2 flex-1 space-y-1">
                        {v.reasons.map((r) => (
                          <li key={r} className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Star size={11} className="shrink-0 text-amber-400" /> {r}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-sm font-extrabold text-primary-700">{formatCurrency(venue.price)}</span>
                        <Link to={`/venues/${v.id}`} className="flex items-center gap-1 text-xs font-bold text-slate-700 transition hover:text-primary-700">
                          View <ArrowRight size={12} />
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Vendors */}
          <section aria-label="Recommended vendors">
            <SectionHeader title={`Vendors great for ${event.type}s`} count={recs.vendors.length} />
            {recs.vendors.length === 0 ? (
              <p className="text-sm text-slate-400">No vendor matches right now.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recs.vendors.map((v) => {
                  const vendor = v.item as unknown as Vendor;
                  return (
                    <Card key={v.id} hover className="flex flex-col p-5">
                      <div className="flex items-start justify-between gap-2">
                        <Badge color="purple">{vendor.category}</Badge>
                        <MatchScore score={v.matchScore} />
                      </div>
                      <h3 className="mt-2 font-bold text-slate-900">{vendor.businessName}</h3>
                      <ul className="mt-2 flex-1 space-y-1">
                        {v.reasons.map((r) => (
                          <li key={r} className="flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin size={11} className="shrink-0 text-primary-400" /> {r}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-sm font-extrabold text-slate-900">from {formatCurrency(vendor.startingPrice)}</span>
                        <Link to={`/vendors/${v.id}`} className="flex items-center gap-1 text-xs font-bold text-slate-700 transition hover:text-primary-700">
                          View <ArrowRight size={12} />
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Services */}
          <section aria-label="Popular services">
            <SectionHeader title="Popular service packages" count={recs.services.length} />
            {recs.services.length === 0 ? (
              <p className="text-sm text-slate-400">No services found.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recs.services.map((sv) => {
                  const s = sv.item as unknown as Service;
                  const vName = typeof s.vendorId === 'object' ? s.vendorId?.businessName : '';
                  return (
                    <Card key={sv.id} hover className="flex flex-col p-5">
                      <h3 className="font-bold text-slate-900">{s.name}</h3>
                      {vName && <p className="mt-0.5 text-xs text-slate-400">by {vName}</p>}
                      {s.description && <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-500">{s.description}</p>}
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="flex items-center gap-0.5 text-sm font-extrabold text-primary-700">
                          <IndianRupee size={13} />{s.price.toLocaleString('en-IN')}
                          <span className="ml-1 text-[10px] font-medium text-slate-400">{s.pricingType}</span>
                        </span>
                        <Link to="/vendors" className="text-xs font-bold text-slate-700 transition hover:text-primary-700">
                          Browse vendors
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <Link to={`/events/${id}`}><Button variant="outline"><ChevronLeft size={15} /> Back to event</Button></Link>
      </div>
    </div>
  );
};

const SectionHeader = ({ title, count }: { title: string; count: number }) => (
  <div className="mb-4 flex items-baseline justify-between">
    <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
    <span className="text-xs font-semibold text-slate-400">{count} matches</span>
  </div>
);

const MatchScore = ({ score }: { score: number }) => (
  <span
    title={`${score}% match`}
    className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
      score >= 80 ? 'bg-emerald-50 text-emerald-700' : score >= 65 ? 'bg-primary-50 text-primary-700' : 'bg-slate-100 text-slate-500'
    }`}
  >
    {score}% match
  </span>
);
