/* Types mirror the backend Mongoose models exactly */

export type UserRole = 'customer' | 'vendor' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'deleted';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  profileImage?: string;
  status: UserStatus;
  createdAt: string;
}

export interface AdminUser extends User {
  __v?: number;
}

/* ---------- Events ---------- */
export type EventType =
  | 'Wedding' | 'Birthday' | 'Corporate Event' | 'College Event' | 'Conference'
  | 'Concert' | 'Party' | 'Sports Event' | 'Cultural Event' | 'Other';

export type EventStatus = 'planning' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface Event {
  _id: string;
  userId: string | Pick<User, '_id' | 'name'>;
  name: string;
  type: EventType;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  guestCount: number;
  budget: number;
  image?: string;
  status: EventStatus;
  createdAt: string;
}

export interface AdminEvent extends Event {
  customerId: string | Pick<User, '_id' | 'name'>;
}

/* ---------- Guests / Tasks / Expenses ---------- */
export type RSVPStatus = 'pending' | 'confirmed' | 'declined';

export interface Guest {
  _id: string;
  eventId: string;
  name: string;
  email?: string;
  phone?: string;
  guestCount: number;
  rsvpStatus: RSVPStatus;
  createdAt: string;
}

export type TaskStatus = 'todo' | 'in-progress' | 'completed';

export interface Task {
  _id: string;
  eventId: string;
  title: string;
  description?: string;
  assignedTo?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: TaskStatus;
}

export const EXPENSE_CATEGORIES = [
  'Venue', 'Catering', 'Decoration', 'Photography', 'Music',
  'Transportation', 'Invitation', 'Security', 'Miscellaneous',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  _id: string;
  eventId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
}

/* ---------- Venues ---------- */
export interface Venue {
  _id: string;
  name: string;
  description?: string;
  location: string;
  address?: string;
  capacity: number;
  price: number;
  facilities: string[];
  images: string[];
  rating: number;
  reviewCount: number;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  status: 'active' | 'suspended';
}

/* ---------- Vendors & Services ---------- */
export type VendorCategory =
  | 'Catering' | 'Photography' | 'Videography' | 'Decoration' | 'DJ' | 'Music'
  | 'Makeup Artist' | 'Florist' | 'Wedding Planner' | 'Security' | 'Transportation'
  | 'Invitation Designer' | 'Event Equipment' | 'Other';

export interface AvailabilityDay {
  day: string;
  open: boolean;
  from: string;
  to: string;
}

export interface Vendor {
  _id: string;
  userId: string | Pick<User, '_id' | 'name' | 'email' | 'profileImage'>;
  businessName: string;
  category: VendorCategory;
  description?: string;
  location: string;
  phone: string;
  email?: string;
  profileImage?: string;
  portfolio: string[];
  startingPrice: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  status: 'active' | 'suspended';
  availability: AvailabilityDay[];
}

export type PricingType = 'Fixed' | 'Per Person' | 'Per Hour' | 'Custom Quote';

export interface Service {
  _id: string;
  vendorId: string | { _id: string; businessName?: string; category?: string; profileImage?: string };
  name: string;
  description?: string;
  category: string;
  price: number;
  pricingType: PricingType;
  duration?: string;
  images: string[];
  status: 'active' | 'inactive';
}

/* ---------- Bookings & Payments ---------- */
export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
export type PayStatus = 'unpaid' | 'paid' | 'refunded';

export interface Booking {
  _id: string;
  customerId: string | Pick<User, '_id' | 'name'>;
  eventId?: string | Pick<Event, '_id' | 'name'>;
  vendorId?: string | { _id: string; businessName?: string; category?: string; profileImage?: string };
  venueId?: string | { _id: string; name?: string; location?: Venue };
  serviceId?: string | { _id: string; name?: string };
  date: string;
  startTime: string;
  endTime: string;
  guestCount?: number;
  amount: number;
  status: BookingStatus;
  paymentStatus: PayStatus;
  notes?: string;
  createdAt: string;
}

export type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet';
export type TransactionStatus = 'successful' | 'pending' | 'failed' | 'refunded';

export interface Payment {
  _id: string;
  bookingId: string | Booking;
  customerId: string | Pick<User, '_id' | 'name'>;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId: string;
  status: TransactionStatus;
  createdAt: string;
}

/* ---------- Reviews & Notifications ---------- */
export interface Review {
  _id: string;
  customerId: string | Pick<User, '_id' | 'name' | 'profileImage'>;
  bookingId: string | Pick<Booking, '_id' | 'date'>;
  vendorId?: string | { _id: string; businessName?: string };
  venueId?: string | { _id: string; name?: string };
  rating: number;
  comment: string;
  response?: string;
  status: 'visible' | 'hidden' | 'reported';
  createdAt: string;
}

export type NotificationType =
  | 'booking-request' | 'booking-accepted' | 'booking-rejected' | 'booking-cancelled'
  | 'booking-completed' | 'payment' | 'event-reminder' | 'review'
  | 'review-response' | 'rsvp' | 'account' | 'system';

export interface AppNotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  read: boolean;
  createdAt: string;
}

/* ---------- Dashboards ---------- */
export interface CustomerDashboard {
  stats: {
    totalEvents: number;
    upcomingEvents: number;
    totalBookings: number;
    pendingBookings: number;
    completedBookings: number;
    totalBudget: number;
    amountSpent: number;
    budgetUsedPct: number;
    pendingTasks: number;
  };
  upcomingEvents: Event[];
  recentBookings: Booking[];
  pendingTasks: Array<Task & { eventId: { _id: string; name: string } }>;
  budgetSummary: Array<{
    eventId: string;
    name: string;
    budget: number;
    spent: number;
    remaining: number;
    pct: number;
  }>;
  rsvpStats: { confirmed: number; pending: number; declined: number; invited: number };
  notifications: AppNotification[];
}

export interface AdminDashboard {
  stats: {
    totalUsers: number;
    totalVendors: number;
    pendingVendors: number;
    totalVenues: number;
    totalEvents: number;
    totalBookings: number;
    totalReviews: number;
    totalRevenue: number;
    successfulPayments: number;
  };
  charts: {
    usersByMonth: Array<{ month: string; users: number }>;
    eventsByCategory: Array<{ name: string; value: number }>;
    bookingsByStatus: Array<{ name: string; value: number }>;
    revenueByMonth: Array<{ month: string; revenue: number }>;
    reviewsByRating: Array<{ rating: string; count: number }>;
  };
}

export interface ScoredItem<T = Record<string, unknown>> {
  id: string;
  name: string;
  matchScore: number;
  reasons: string[];
  item: T;
}

export interface Recommendations {
  venues: ScoredItem<Venue>[];
  vendors: ScoredItem<Vendor>[];
  services: ScoredItem<Service>[];
}

export interface PublicStats {
  customers: number;
  vendors: number;
  venues: number;
  events: number;
  bookings: number;
}

/* Populated shapes returned by admin endpoints */
export type AdminBooking = Booking & { customerId: Pick<User, '_id' | 'name' | 'email'> };
export type AdminPayment = Payment;
