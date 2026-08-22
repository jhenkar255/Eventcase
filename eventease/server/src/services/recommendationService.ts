import { Vendor, Venue, Service } from '../models';

export interface RecommendationInput {
  eventType?: string;
  location?: string;
  guestCount?: number;
  budget?: number;
}

export interface ScoredItem {
  id: string;
  name: string;
  matchScore: number;
  reasons: string[];
  item: Record<string, unknown>;
}

const EVENT_TYPE_CATEGORY_MAP: Record<string, string[]> = {
  Wedding: ['Wedding Planner', 'Catering', 'Photography', 'Decoration', 'Makeup Artist'],
  Birthday: ['Decoration', 'Catering', 'DJ', 'Music'],
  'Corporate Event': ['Event Equipment', 'Catering', 'Security', 'Transportation'],
  'College Event': ['DJ', 'Music', 'Event Equipment', 'Security'],
  Conference: ['Event Equipment', 'Security', 'Transportation', 'Invitation Designer'],
  Concert: ['Music', 'DJ', 'Security', 'Event Equipment'],
  Party: ['Catering', 'DJ', 'Decoration', 'Music'],
  'Sports Event': ['Event Equipment', 'Security', 'Transportation'],
  'Cultural Event': ['Decoration', 'Music', 'Catering', 'Florist'],
  Other: [],
};

/**
 * Rule-based recommendation engine.
 *
 * Scoring dimensions (weights sum to 1):
 *  - rating       : normalized average rating            (0.30)
 *  - price        : compatibility with user budget      (0.25)
 *  - location     : city match                          (0.20)
 *  - availability : open bookings / active status       (0.10)
 *  - popularity   : review count + booking history      (0.15)
 *
 * The interface is intentionally simple so a trained model can replace
 * `scoreVendor`/`scoreVenue` later without changing callers.
 */
export const recommendationService = {
  scoreVendor(
    vendor: { rating: number; reviewCount: number; location: string; startingPrice: number; verified: boolean; category: string },
    input: RecommendationInput
  ): number {
    const weights = { rating: 0.3, price: 0.25, location: 0.2, availability: 0.1, popularity: 0.15 };
    let score = 0;

    const ratingScore = (vendor.rating / 5) * 100;
    score += weights.rating * ratingScore;

    if (input.budget && input.budget > 0) {
      // ideal: starting price is between 5% and 40% of total budget
      const ratio = vendor.startingPrice / input.budget;
      let priceScore = 100;
      if (ratio > 1) priceScore = Math.max(0, 100 - (ratio - 1) * 200);
      else if (ratio < 0.05) priceScore = 70;
      else priceScore = 70 + Math.min(30, ((ratio - 0.05) / 0.35) * 30);
      score += weights.price * priceScore;
    } else {
      score += weights.price * 60;
    }

    if (input.location) {
      const loc = input.location.toLowerCase().trim();
      score += weights.location * (vendor.location.toLowerCase().includes(loc) ? 100 : 30);
    } else {
      score += weights.location * 60;
    }

    score += weights.availability * (vendor.verified ? 100 : 55);

    const popularityScore = Math.min(100, (vendor.reviewCount / 50) * 100 + 20);
    score += weights.popularity * popularityScore;

    return Math.round(Math.min(99, score));
  },

  scoreVenue(
    venue: { rating: number; reviewCount: number; location: string; capacity: number; price: number },
    input: RecommendationInput
  ): number {
    const weights = { rating: 0.3, price: 0.25, location: 0.2, capacity: 0.15, popularity: 0.1 };
    let score = 0;

    score += weights.rating * (venue.rating / 5) * 100;

    if (input.budget && input.budget > 0) {
      // venues typically consume ~30% of event budget
      const ratio = venue.price / (input.budget * 0.4);
      let priceScore = 100;
      if (ratio > 1.2) priceScore = Math.max(0, 100 - (ratio - 1.2) * 150);
      else priceScore = 75 + (ratio / 1.2) * 25;
      score += weights.price * priceScore;
    } else {
      score += weights.price * 60;
    }

    if (input.location) {
      const loc = input.location.toLowerCase().trim();
      score += weights.location * (venue.location.toLowerCase().includes(loc) ? 100 : 25);
    } else {
      score += weights.location * 60;
    }

    if (input.guestCount && input.guestCount > 0) {
      const capRatio = venue.capacity / input.guestCount;
      const capacityScore = capRatio >= 1 ? (capRatio <= 2 ? 100 : Math.max(50, 100 - (capRatio - 2) * 20)) : Math.max(0, capRatio * 80);
      score += weights.capacity * capacityScore;
    } else {
      score += weights.capacity * 60;
    }

    score += weights.popularity * Math.min(100, (venue.reviewCount / 50) * 100 + 20);

    return Math.round(Math.min(99, score));
  },

  async getRecommendations(input: RecommendationInput): Promise<{
    venues: ScoredItem[];
    vendors: ScoredItem[];
    services: ScoredItem[];
  }> {
    const preferredCategories = input.eventType ? EVENT_TYPE_CATEGORY_MAP[input.eventType] || [] : [];

    const [venues, vendors] = await Promise.all([
      Venue.find({ status: 'active', verificationStatus: 'approved' }).lean(),
      Vendor.find({ status: 'active', verificationStatus: 'approved' }).lean(),
    ]);

    const scoredVenues: ScoredItem[] = venues.map((v) => ({
      id: String(v._id),
      name: v.name,
      matchScore: this.scoreVenue(v as never, input),
      reasons: [
        v.location === input.location ? 'In your city' : `${v.location}`,
        `Up to ${v.capacity} guests`,
        v.rating >= 4 ? `Highly rated (${v.rating.toFixed(1)})` : `Rated ${v.rating.toFixed(1)}`,
      ].slice(0, 2),
      item: v,
    }));

    const scoredVendors: ScoredItem[] = vendors.map((v) => {
      const categoryBonus = preferredCategories.includes(v.category) ? 6 : 0;
      return {
        id: String(v._id),
        name: v.businessName,
        matchScore: Math.min(99, this.scoreVendor(v as never, input) + categoryBonus),
        reasons: [
          preferredCategories.includes(v.category) ? `Great for ${input.eventType}` : v.category,
          v.location.toLowerCase() === (input.location || '').toLowerCase() ? 'In your city' : v.location,
        ].slice(0, 2),
        item: v,
      };
    });

    scoredVenues.sort((a, b) => b.matchScore - a.matchScore);
    scoredVendors.sort((a, b) => b.matchScore - a.matchScore);

    const topVenueIds = scoredVenues.slice(0, 8).map((v) => v.id);
    const topVendorIds = scoredVendors.slice(0, 10).map((v) => v.id);

    const services = await Service.find({
      vendorId: { $in: [...topVenueIds.length ? [] : [], ...topVendorIds.map((id) => id)] },
      status: 'active',
    })
      .populate('vendorId', 'businessName category profileImage rating')
      .limit(12)
      .lean();

    const scoredServices: ScoredItem[] = services.map((s: Record<string, unknown>) => {
      const vendor = s.vendorId as { _id: { toString(): string }; businessName?: string; category?: string } | undefined;
      const parent = scoredVendors.find((v) => v.id === String(vendor?._id ?? ''));
      return {
        id: String(s._id),
        name: s.name as string,
        matchScore: parent?.matchScore ?? 70,
        reasons: [String(vendor?.category ?? ''), String(s.pricingType ?? '')].filter(Boolean).slice(0, 2),
        item: s,
      };
    });
    scoredServices.sort((a, b) => b.matchScore - a.matchScore);

    return {
      venues: scoredVenues.slice(0, 6),
      vendors: scoredVendors.slice(0, 8),
      services: scoredServices.slice(0, 6),
    };
  },
};
