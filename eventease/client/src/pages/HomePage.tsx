import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, CalendarDays, Wallet, ArrowRight, Heart, Briefcase,
  Cake, GraduationCap, Mic2, Music2, PartyPopper, Trophy, Palette, Sparkles,
  Building2, Store, Star, CheckCircle2, Camera, UtensilsCrossed, Quote,
  IndianRupee, Gem, Flame, Users, CalendarHeart,
} from 'lucide-react';
import { venueApi, vendorApi, reviewApi, userApi, getErrorMessage } from '../services/api';
import type { Venue, Vendor, Review } from '../types';
import { VenueCard, ReviewCard } from '../components';
import { Button, Select, Input, SectionTitle, RatingStars, ErrorBanner } from '../components/ui';
import { EVENT_TYPES, FESTIVALS } from '../utils/constants';

const categoryIcons: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  Wedding: Heart, Birthday: Cake, 'Corporate Event': Briefcase, 'College Event': GraduationCap,
  Conference: Mic2, Concert: Music2, Party: PartyPopper, 'Sports Event': Trophy,
  'Cultural Event': Palette, Festival: Flame, Engagement: Gem, Anniversary: CalendarHeart,
  Housewarming: Building2, Other: Sparkles,
};

const howItWorks = [
  { step: '1', title: 'Create your event', desc: 'Set the date, guest count and budget. Choose from weddings, festivals, birthdays or any celebration.', icon: CalendarDays },
  { step: '2', title: 'Discover & book', desc: 'Browse verified venues and vendors across India, compare prices and reviews, and book instantly.', icon: Search },
  { step: '3', title: 'Pay securely', desc: 'Confirm bookings with secure payments in ₹ and track every rupee in your budget planner.', icon: IndianRupee },
  { step: '4', title: 'Celebrate & review', desc: 'Enjoy your flawless event, then share your experience to help the community.', icon: PartyPopper },
];

export const HomePage = () => {
  const navigate = useNavigate();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState({ type: '', location: '', date: '', budget: '' });

  useEffect(() => {
    Promise.all([
      venueApi.list({ sort: 'rating', limit: 6 }),
      vendorApi.list({ sort: 'rating', limit: 8 }),
      reviewApi.list({ limit: 6 }),
      userApi.publicStats(),
    ])
      .then(([v, ve, r, s]) => {
        setVenues(v.data.data.venues as Venue[]);
        setVendors(ve.data.data.vendors as Vendor[]);
        setReviews(r.data.data.reviews as Review[]);
        setStats((s.data.data as { stats: Record<string, number> }).stats);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const doSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.location) params.set('location', search.location);
    if (search.date) params.set('date', search.date);
    if (search.budget) params.set('maxPrice', search.budget);
    navigate(`/venues?${params.toString()}`);
  };

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-saffron-600">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-gold-400/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-primary-400/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute top-20 left-20 h-40 w-40 rounded-full bg-rose-400/10 blur-2xl" aria-hidden />

        {/* Floating decorative elements */}
        <div className="pointer-events-none absolute top-16 left-[15%] text-4xl opacity-20 animate-float" aria-hidden>🪔</div>
        <div className="pointer-events-none absolute top-32 right-[20%] text-3xl opacity-15 animate-float" style={{ animationDelay: '2s' }} aria-hidden>🪷</div>
        <div className="pointer-events-none absolute bottom-20 left-[30%] text-2xl opacity-15 animate-float" style={{ animationDelay: '4s' }} aria-hidden>✨</div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-300/40 bg-gold-400/15 px-4 py-1.5 text-xs font-bold text-gold-100 backdrop-blur">
            <Sparkles size={13} /> 🇮🇳 India's all-in-one event planning platform
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl marigold-glow">
            Plan Your Perfect Event,<br />
            <span className="bg-gradient-to-r from-gold-300 to-gold-100 bg-clip-text text-transparent">Effortlessly</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-primary-100 sm:text-lg">
            From grand weddings to intimate gatherings, from Diwali celebrations to corporate events — discover venues, book trusted vendors, and manage every detail in one place.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link to="/events/new">
              <Button size="lg" className="!bg-white !text-primary-700 hover:!bg-primary-50 shadow-lg">
                <CalendarHeart size={18} /> Plan an Event
              </Button>
            </Link>
            <Link to="/vendors">
              <Button size="lg" variant="outline" className="!border-white/40 !bg-transparent !text-white hover:!bg-white/10">
                <Store size={18} /> Explore Vendors
              </Button>
            </Link>
          </div>

          {/* ---------- SEARCH ---------- */}
          <form onSubmit={doSearch} className="mx-auto mt-12 max-w-4xl rounded-2xl bg-white p-4 shadow-xl sm:p-5" aria-label="Search venues">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Select
                id="hero-type"
                label="Event Type"
                options={EVENT_TYPES.map((t) => ({ value: t, label: t }))}
                placeholder="Any type"
                value={search.type}
                onChange={(e) => setSearch((s) => ({ ...s, type: e.target.value }))}
              />
              <Input id="hero-location" label="City" placeholder="Bangalore, Delhi, Mumbai…" value={search.location} onChange={(e) => setSearch((s) => ({ ...s, location: e.target.value }))} />
              <Input id="hero-date" label="Date" type="date" value={search.date} onChange={(e) => setSearch((s) => ({ ...s, date: e.target.value }))} />
              <Select
                id="hero-budget"
                label="Budget"
                options={[
                  { value: '50000', label: 'Under ₹50K' },
                  { value: '100000', label: 'Under ₹1L' },
                  { value: '250000', label: 'Under ₹2.5L' },
                  { value: '500000', label: 'Under ₹5L' },
                  { value: '1000000', label: 'Under ₹10L' },
                ]}
                placeholder="Any budget"
                value={search.budget}
                onChange={(e) => setSearch((s) => ({ ...s, budget: e.target.value }))}
              />
              <div className="flex items-end">
                <Button type="submit" fullWidth size="lg" className="!bg-gradient-to-r !from-primary-500 !to-primary-600">
                  <Search size={17} /> Search
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ---------- INDIAN FESTIVALS SECTION ---------- */}
      <section className="bg-mandala py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Celebrate every Indian festival"
            subtitle="From Diwali to Onam, plan celebrations for every occasion"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {FESTIVALS.map((f) => (
              <Link
                key={f.name}
                to={`/vendors?search=${encodeURIComponent(f.name)}`}
                className="group relative overflow-hidden rounded-xl border border-slate-200/70 bg-white p-5 text-center shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 transition group-hover:opacity-5`} aria-hidden />
                <span className="text-4xl">{f.emoji}</span>
                <h3 className="mt-2 text-sm font-bold text-slate-800">{f.name}</h3>
                <p className="mt-0.5 text-xs text-slate-400">{f.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CATEGORIES ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionTitle title="Popular event categories" subtitle="Whatever you're celebrating, we've got you covered" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {EVENT_TYPES.filter((t) => t !== 'Other').slice(0, 10).map((type) => {
            const Icon = categoryIcons[type] ?? Sparkles;
            return (
              <Link
                key={type}
                to={`/vendors?search=${encodeURIComponent(type)}`}
                className="group flex flex-col items-center gap-3 rounded-xl border border-slate-200/70 bg-white p-6 text-center shadow-card transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-card-hover"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600 transition group-hover:bg-gradient-to-br group-hover:from-primary-500 group-hover:to-primary-600 group-hover:text-white">
                  <Icon size={22} />
                </span>
                <span className="text-sm font-bold text-slate-800">{type}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------- FEATURED VENUES ---------- */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Featured venues across India"
            subtitle="Hand-picked spaces loved by our community"
            action={
              <Link to="/venues" className="inline-flex items-center gap-1 text-sm font-bold text-primary-600 hover:text-primary-800">
                View all <ArrowRight size={15} />
              </Link>
            }
          />
          {error ? (
            <ErrorBanner message={error} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {venues.map((v) => (
                <VenueCard key={v._id} venue={v} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------- POPULAR VENDORS ---------- */}
      <section className="bg-mandala py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Popular vendors"
            subtitle="Trusted professionals for every need — from caterers to photographers"
            action={
              <Link to="/vendors" className="inline-flex items-center gap-1 text-sm font-bold text-primary-600 hover:text-primary-800">
                View all <ArrowRight size={15} />
              </Link>
            }
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {vendors.map((v) => (
              <VendorCardMini key={v._id} vendor={v} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-saffron-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-extrabold sm:text-3xl marigold-glow">How it works</h2>
            <p className="mt-2 text-primary-100">From idea to celebration in four simple steps</p>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {howItWorks.map((s, i) => (
              <div key={s.step} className="relative rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur">
                <span className="absolute -top-4 left-6 flex h-9 w-9 items-center justify-center rounded-full bg-gold-400 text-sm font-extrabold text-primary-900 shadow-lg">
                  {s.step}
                </span>
                {i < 3 && <ArrowRight size={18} className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-white/30 md:block" aria-hidden />}
                <s.icon size={24} className="mt-4 text-gold-300" />
                <h3 className="mt-3 font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-primary-100">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- REVIEWS ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionTitle title="What our customers say" subtitle="Real experiences from real celebrations" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 6).map((r) => (
            <ReviewCard key={r._id} review={r} showTarget />
          ))}
          {reviews.length === 0 && !error && (
            <p className="col-span-full py-8 text-center text-sm text-slate-400">Reviews will appear here once customers share their experiences.</p>
          )}
        </div>
      </section>

      {/* ---------- STATISTICS ---------- */}
      <section className="border-y border-saffron-100/50 bg-white py-14">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 text-center md:grid-cols-4 sm:px-6">
          {[
            { icon: Store, label: 'Verified vendors', value: stats?.vendors ?? 0, color: 'text-primary-500' },
            { icon: Building2, label: 'Premium venues', value: stats?.venues ?? 0, color: 'text-gold-500' },
            { icon: CalendarDays, label: 'Events planned', value: stats?.events ?? 0, color: 'text-emerald-500' },
            { icon: CheckCircle2, label: 'Bookings completed', value: stats?.bookings ?? 0, color: 'text-rose-500' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label}>
              <Icon size={26} className={`mx-auto ${color}`} aria-hidden />
              <p className="mt-3 text-3xl font-extrabold text-slate-900">{value.toLocaleString('en-IN')}+</p>
              <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 via-primary-500 to-saffron-500 px-8 py-14 text-center text-white sm:px-16 rangoli-corner">
          <Quote size={120} className="pointer-events-none absolute -left-6 -top-6 opacity-10" aria-hidden />
          <div className="pointer-events-none absolute -bottom-10 -right-10 text-8xl opacity-10" aria-hidden>🪷</div>
          <h2 className="text-3xl font-extrabold sm:text-4xl marigold-glow">Ready to plan something unforgettable?</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-100">
            Join thousands of Indian families who trust EventEase for weddings, festivals, birthdays and every celebration in between.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="!bg-white !text-primary-700 hover:!bg-primary-50 shadow-lg">
                Get started free
              </Button>
            </Link>
            <Link to="/venues">
              <Button size="lg" variant="outline" className="!border-white/40 !bg-transparent !text-white hover:!bg-white/10">
                Browse venues
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

const VendorCardMini = ({ vendor }: { vendor: Vendor }) => {
  const icons: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
    Catering: UtensilsCrossed, Photography: Camera, Decoration: Palette, DJ: Music2, Transportation: MapPin,
  };
  const Icon = icons[vendor.category] ?? Store;
  return (
    <Link to={`/vendors/${vendor._id}`} className="card-base group block p-5 transition hover:-translate-y-0.5 hover:shadow-card-hover rangoli-corner">
      <div className="flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition group-hover:bg-gradient-to-br group-hover:from-primary-500 group-hover:to-primary-600 group-hover:text-white">
          <Icon size={21} />
        </span>
        {vendor.rating > 0 && (
          <span className="flex items-center gap-1 text-xs font-bold text-gold-600">
            <Star size={13} fill="#f59e0b" className="text-gold-500" /> {vendor.rating.toFixed(1)}
          </span>
        )}
      </div>
      <h3 className="mt-3 truncate font-bold text-slate-900">{vendor.businessName}</h3>
      <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-primary-400">{vendor.category}</p>
      <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
        <MapPin size={13} /> {vendor.location || 'India'}
      </p>
      <RatingStars rating={vendor.rating} size={11} showValue />
    </Link>
  );
};
