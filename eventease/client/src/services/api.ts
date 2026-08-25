import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eventease_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ApiErrorShape {
  success: false;
  message: string;
}

export const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorShape | undefined;
    if (data?.message) return data.message;
    if (err.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the backend running?';
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
};

/* ---------- Auth ---------- */
export const authApi = {
  register: (payload: Record<string, string>) => api.post('/auth/register', payload),
  login: (payload: Record<string, string>) => api.post('/auth/login', payload),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  me: () => api.get('/auth/me'),
  updateProfile: (payload: { name: string; phone?: string }) => api.put('/auth/profile', payload),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', payload),
};

/* ---------- Users / dashboard / search / recommendations ---------- */
export const userApi = {
  publicStats: () => api.get('/users/stats'),
  dashboard: () => api.get('/users/dashboard'),
  search: (q: string) => api.get('/users/search', { params: { q } }),
  recommendations: (body: { eventType?: string; location?: string; guestCount?: number; budget?: number }) =>
    api.post('/users/recommendations', body),
};

/* ---------- Events + nested guests/tasks/expenses ---------- */
export const eventApi = {
  list: (params?: Record<string, unknown>) => api.get('/events', { params }),
  get: (id: string) => api.get(`/events/${id}`),
  create: (body: Record<string, unknown>) => api.post('/events', body),
  update: (id: string, body: Record<string, unknown>) => api.put(`/events/${id}`, body),
  remove: (id: string) => api.delete(`/events/${id}`),

  guests: (eventId: string, params?: Record<string, unknown>) =>
    api.get(`/events/${eventId}/guests`, { params }),
  addGuest: (eventId: string, body: Record<string, unknown>) =>
    api.post(`/events/${eventId}/guests`, body),
  updateGuest: (eventId: string, guestId: string, body: Record<string, unknown>) =>
    api.put(`/events/${eventId}/guests/${guestId}`, body),
  deleteGuest: (eventId: string, guestId: string) =>
    api.delete(`/events/${eventId}/guests/${guestId}`),
  inviteGuest: (eventId: string, guestId: string) =>
    api.post(`/events/${eventId}/guests/${guestId}/invite`),

  tasks: (eventId: string, params?: Record<string, unknown>) =>
    api.get(`/events/${eventId}/tasks`, { params }),
  addTask: (eventId: string, body: Record<string, unknown>) =>
    api.post(`/events/${eventId}/tasks`, body),
  updateTask: (eventId: string, taskId: string, body: Record<string, unknown>) =>
    api.put(`/events/${eventId}/tasks/${taskId}`, body),
  deleteTask: (eventId: string, taskId: string) =>
    api.delete(`/events/${eventId}/tasks/${taskId}`),

  expenses: (eventId: string) => api.get(`/events/${eventId}/expenses`),
  addExpense: (eventId: string, body: Record<string, unknown>) =>
    api.post(`/events/${eventId}/expenses`, body),
  updateExpense: (eventId: string, expenseId: string, body: Record<string, unknown>) =>
    api.put(`/events/${eventId}/expenses/${expenseId}`, body),
  deleteExpense: (eventId: string, expenseId: string) =>
    api.delete(`/events/${eventId}/expenses/${expenseId}`),
};

/* ---------- Venues ---------- */
export const venueApi = {
  list: (params?: Record<string, unknown>) => api.get('/venues', { params }),
  get: (id: string) => api.get(`/venues/${id}`),
  availability: (id: string) => api.get(`/venues/${id}/availability`),
  /* admin-only */
  create: (body: Record<string, unknown>) => api.post('/venues', body),
  update: (id: string, body: Record<string, unknown>) => api.put(`/venues/${id}`, body),
  remove: (id: string) => api.delete(`/venues/${id}`),
};

/* ---------- Vendors ---------- */
export const vendorApi = {
  list: (params?: Record<string, unknown>) => api.get('/vendors', { params }),
  get: (id: string) => api.get(`/vendors/${id}`),
  myProfile: () => api.get('/vendors/me/profile'),
  createProfile: (body: Record<string, unknown>) => api.post('/vendors/me/profile', body),
  updateMyProfile: (body: Record<string, unknown>) => api.put('/vendors/me/profile', body),
  stats: () => api.get('/vendors/me/stats'),
  availability: () => api.get('/vendors/me/availability'),
  updateAvailability: (availability: Array<{ day: string; open: boolean; from: string; to: string }>) =>
    api.put('/vendors/me/availability', { availability }),
  respondToReview: (reviewId: string, response: string) =>
    api.put(`/vendors/reviews/${reviewId}/respond`, { response }),
};

/* ---------- Services ---------- */
export const serviceApi = {
  list: (params?: Record<string, unknown>) => api.get('/services', { params }),
  get: (id: string) => api.get(`/services/${id}`),
  mine: () => api.get('/vendors/me/services'),
  create: (body: Record<string, unknown>) => api.post('/vendors/me/services', body),
  update: (id: string, body: Record<string, unknown>) => api.put(`/vendors/me/services/${id}`, body),
  remove: (id: string) => api.delete(`/vendors/me/services/${id}`),
};

/* ---------- Bookings ---------- */
export const bookingApi = {
  list: (params?: Record<string, unknown>) => api.get('/bookings', { params }),
  get: (id: string) => api.get(`/bookings/${id}`),
  create: (body: Record<string, unknown>) => api.post('/bookings', body),
  updateStatus: (id: string, status: string) => api.put(`/bookings/${id}`, { status }),
  cancel: (id: string) => api.delete(`/bookings/${id}`),
};

/* ---------- Payments ---------- */
export const paymentApi = {
  pay: (bookingId: string, paymentMethod: string) =>
    api.post('/payments', { bookingId, paymentMethod }),
  list: (params?: Record<string, unknown>) => api.get('/payments', { params }),
  get: (id: string) => api.get(`/payments/${id}`),
};

/* ---------- Reviews ---------- */
export const reviewApi = {
  list: (params?: Record<string, unknown>) => api.get('/reviews', { params }),
  mine: () => api.get('/reviews/me/reviews'),
  create: (body: { bookingId: string; rating: number; comment: string }) =>
    api.post('/reviews', body),
  update: (id: string, body: { rating: number; comment: string }) => api.put(`/reviews/${id}`, body),
  remove: (id: string) => api.delete(`/reviews/${id}`),
};

/* ---------- Notifications ---------- */
export const notificationApi = {
  list: (params?: Record<string, unknown>) => api.get('/notifications', { params }),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

/* ---------- Admin ---------- */
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  setUserStatus: (id: string, status: 'active' | 'suspended') =>
    api.put(`/admin/users/${id}/status`, { status }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  vendors: (params?: Record<string, unknown>) => api.get('/admin/vendors', { params }),
  verifyVendor: (id: string, decision: 'approved' | 'rejected') =>
    api.put(`/admin/vendors/${id}/verification`, { decision }),
  venues: (params?: Record<string, unknown>) => api.get('/admin/venues', { params }),
  verifyVenue: (id: string, decision: 'approved' | 'rejected') =>
    api.put(`/admin/venues/${id}/verification`, { decision }),
  events: (params?: Record<string, unknown>) => api.get('/admin/events', { params }),
  bookings: (params?: Record<string, unknown>) => api.get('/admin/bookings', { params }),
  payments: (params?: Record<string, unknown>) => api.get('/admin/payments', { params }),
  reviews: (params?: Record<string, unknown>) => api.get('/admin/reviews', { params }),
  moderateReview: (id: string, action: 'hide' | 'delete') =>
    api.put(`/admin/reviews/${id}/moderate`, { action }),
};
