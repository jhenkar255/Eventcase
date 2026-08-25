import { Link } from 'react-router-dom';
import { MapPin, Users, CalendarDays, IndianRupee, BadgeCheck, Star } from 'lucide-react';
import type { Event, Vendor, Venue } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { Badge, RatingStars } from './ui';

const Img = ({ src, alt, className }: { src?: string; alt: string; className: string }) =>
  src ? (
    <img src={src} alt={alt} loading="lazy" className={className} />
  ) : (
    <div className={`${className} flex items-center justify-center bg-gradient-to-br from-primary-100 to-saffron-100 text-primary-400`}>
      <CalendarDays size={32} />
    </div>
  );

export const EventCard = ({ event, onClick }: { event: Event; onClick?: () => void }) => {
  const d = new Date(event.date);
  return (
    <div className="card-base group overflow-hidden transition hover:shadow-card-hover rangoli-corner" onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className="relative h-40 overflow-hidden">
        <Img src={event.image} alt={event.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        <div className="absolute left-3 top-3">
          <Badge color="amber">{event.type}</Badge>
        </div>
        <div className="absolute bottom-0 right-0 flex h-14 w-14 flex-col items-center justify-center rounded-tl-xl bg-white/95 backdrop-blur">
          <span className="text-lg font-extrabold leading-none text-slate-900">{d.getDate()}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
            {d.toLocaleString('en-IN', { month: 'short' })}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="truncate font-bold text-slate-900">{event.name}</h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin size={14} className="shrink-0" /> <span className="truncate">{event.location}</span>
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-saffron-100/50 pt-3 text-xs">
          <span className="flex items-center gap-1 text-slate-500">
            <Users size={13} /> {event.guestCount} guests
          </span>
          <span className="font-bold text-primary-700">{formatCurrency(event.budget)}</span>
        </div>
      </div>
    </div>
  );
};

export const VenueCard = ({ venue }: { venue: Venue }) => (
  <Link to={`/venues/${venue._id}`} className="card-base group block overflow-hidden transition hover:shadow-card-hover rangoli-corner" aria-label={`View ${venue.name}`}>
    <div className="relative h-44 overflow-hidden">
      <Img src={venue.images?.[0]} alt={venue.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      <div className="absolute bottom-2 left-2 rounded-md bg-white/95 px-2 py-1 text-xs font-bold text-primary-700 shadow-sm backdrop-blur">
        <IndianRupee size={11} className="mb-0.5 inline" />
        {venue.price.toLocaleString('en-IN')} / day
      </div>
      {venue.verificationStatus === 'approved' && (
        <div className="absolute top-2 right-2 rounded-md bg-white/95 px-2 py-1 shadow-sm backdrop-blur">
          <RatingStars rating={venue.rating} size={12} showValue />
        </div>
      )}
    </div>
    <div className="p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="truncate font-bold text-slate-900">{venue.name}</h3>
        <span className="shrink-0 text-xs font-semibold text-emerald-700">✓ Verified</span>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
        <MapPin size={14} className="shrink-0" /> {venue.location}
      </p>
      <div className="mt-3 flex items-center justify-between border-t border-saffron-100/50 pt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Users size={13} /> Up to {venue.capacity.toLocaleString('en-IN')}
        </span>
        <span>{venue.reviewCount} reviews</span>
      </div>
    </div>
  </Link>
);

export const VendorCard = ({ vendor }: { vendor: Vendor }) => (
  <Link to={`/vendors/${vendor._id}`} className="card-base group block overflow-hidden transition hover:shadow-card-hover rangoli-corner" aria-label={`View ${vendor.businessName}`}>
    <div className="relative h-36 overflow-hidden bg-gradient-to-br from-primary-500 to-saffron-600">
      <Img src={vendor.profileImage} alt={vendor.businessName} className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-105" />
      <div className="absolute top-2 left-2">
        <Badge color="amber">{vendor.category}</Badge>
      </div>
      {vendor.verified && (
        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-xs font-bold text-emerald-700 shadow-sm backdrop-blur">
          <BadgeCheck size={13} /> Verified
        </div>
      )}
    </div>
    <div className="p-4">
      <h3 className="truncate font-bold text-slate-900">{vendor.businessName}</h3>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
        <MapPin size={14} className="shrink-0" /> {vendor.location || 'India'}
      </p>
      <div className="mt-3 flex items-center justify-between border-t border-saffron-100/50 pt-3">
        <RatingStars rating={vendor.rating} size={13} showValue />
        <span className="text-sm font-bold text-primary-700">from {formatCompactPrice(vendor.startingPrice)}</span>
      </div>
    </div>
  </Link>
);

const formatCompactPrice = (n: number) => {
  if (!n) return '₹0';
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
};
