import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { MainLayout } from './layouts/MainLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingSpinner } from './components/ui';
import { ScrollToTop } from './components/ScrollToTop';

/* Route-level code splitting: each page loads its own chunk on demand */
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const VenuesPage = lazy(() => import('./pages/VenuesPage').then((m) => ({ default: m.VenuesPage })));
const VenueDetailPage = lazy(() => import('./pages/VenueDetailPage').then((m) => ({ default: m.VenueDetailPage })));
const VendorsPage = lazy(() => import('./pages/VendorsPage').then((m) => ({ default: m.VendorsPage })));
const VendorDetailPage = lazy(() => import('./pages/VendorDetailPage').then((m) => ({ default: m.VendorDetailPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.ContactPage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));

// Shared authed pages
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const NotificationsPage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.NotificationsPage })));

// Customer pages
const CustomerDashboardPage = lazy(() => import('./pages/CustomerDashboardPage').then((m) => ({ default: m.CustomerDashboardPage })));
const EventsListPage = lazy(() => import('./pages/EventsListPage').then((m) => ({ default: m.EventsListPage })));
const EventFormPage = lazy(() => import('./pages/EventFormPage').then((m) => ({ default: m.EventFormPage })));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage').then((m) => ({ default: m.EventDetailPage })));
const RecommendationsPage = lazy(() => import('./pages/event/RecommendationsPage').then((m) => ({ default: m.RecommendationsPage })));
const BookingsPage = lazy(() => import('./pages/BookingsPage').then((m) => ({ default: m.BookingsPage })));
const PaymentsListPage = lazy(() => import('./pages/PaymentsListPage').then((m) => ({ default: m.PaymentsListPage })));
const PaymentReceiptPage = lazy(() => import('./pages/PaymentReceiptPage').then((m) => ({ default: m.PaymentReceiptPage })));

// Vendor pages
const VendorDashboardPage = lazy(() => import('./pages/vendor/VendorDashboardPage').then((m) => ({ default: m.VendorDashboardPage })));
const VendorProfilePage = lazy(() => import('./pages/vendor/VendorProfilePage').then((m) => ({ default: m.VendorProfilePage })));
const VendorServicesPage = lazy(() => import('./pages/vendor/VendorServicesPage').then((m) => ({ default: m.VendorServicesPage })));
const VendorBookingsPage = lazy(() => import('./pages/vendor/VendorBookingsPage').then((m) => ({ default: m.VendorBookingsPage })));
const VendorReviewsPage = lazy(() => import('./pages/vendor/VendorReviewsPage').then((m) => ({ default: m.VendorReviewsPage })));
const VendorAvailabilityPage = lazy(() => import('./pages/vendor/VendorAvailabilityPage').then((m) => ({ default: m.VendorAvailabilityPage })));

// Admin pages
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })));
const AdminVendorsPage = lazy(() => import('./pages/admin/AdminVendorsPage').then((m) => ({ default: m.AdminVendorsPage })));
const AdminVenuesPage = lazy(() => import('./pages/admin/AdminVenuesPage').then((m) => ({ default: m.AdminVenuesPage })));
const AdminEventsPage = lazy(() => import('./pages/admin/AdminEventsPage').then((m) => ({ default: m.AdminEventsPage })));
const AdminBookingsPage = lazy(() => import('./pages/admin/AdminBookingsPage').then((m) => ({ default: m.AdminBookingsPage })));
const AdminPaymentsPage = lazy(() => import('./pages/admin/AdminPaymentsPage').then((m) => ({ default: m.AdminPaymentsPage })));
const AdminReviewsPage = lazy(() => import('./pages/admin/AdminReviewsPage').then((m) => ({ default: m.AdminReviewsPage })));

const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<LoadingSpinner full label="Loading…" />}>
          <Routes>
            {/* Public + shared pages */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/venues" element={<VenuesPage />} />
              <Route path="/venues/:id" element={<VenueDetailPage />} />
              <Route path="/vendors" element={<VendorsPage />} />
              <Route path="/vendors/:id" element={<VendorDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* Customer portal */}
              <Route element={<ProtectedRoute roles={['customer', 'admin']} />}>
                <Route element={<DashboardLayout role="customer" />}>
                  <Route path="/dashboard" element={<CustomerDashboardPage />} />
                  <Route path="/events" element={<EventsListPage />} />
                  <Route path="/events/new" element={<EventFormPage />} />
                  <Route path="/events/:id/edit" element={<EventFormPage />} />
                  <Route path="/events/:id" element={<EventDetailPage />} />
                  <Route path="/events/:id/recommendations" element={<RecommendationsPage />} />
                  <Route path="/bookings" element={<BookingsPage />} />
                  <Route path="/payments/list" element={<PaymentsListPage />} />
                  <Route path="/payments/:id" element={<PaymentReceiptPage />} />
                </Route>
              </Route>

              {/* Vendor portal */}
              <Route element={<ProtectedRoute roles={['vendor']} />}>
                <Route element={<DashboardLayout role="vendor" />}>
                  <Route path="/vendor" element={<VendorDashboardPage />} />
                  <Route path="/vendor/profile" element={<VendorProfilePage />} />
                  <Route path="/vendor/services" element={<VendorServicesPage />} />
                  <Route path="/vendor/bookings" element={<VendorBookingsPage />} />
                  <Route path="/vendor/reviews" element={<VendorReviewsPage />} />
                  <Route path="/vendor/availability" element={<VendorAvailabilityPage />} />
                </Route>
              </Route>

              {/* Admin console */}
              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route element={<DashboardLayout role="admin" />}>
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/admin/vendors" element={<AdminVendorsPage />} />
                  <Route path="/admin/venues" element={<AdminVenuesPage />} />
                  <Route path="/admin/events" element={<AdminEventsPage />} />
                  <Route path="/admin/bookings" element={<AdminBookingsPage />} />
                  <Route path="/admin/payments" element={<AdminPaymentsPage />} />
                  <Route path="/admin/reviews" element={<AdminReviewsPage />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
