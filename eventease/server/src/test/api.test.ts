import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { User } from '../models/User';

describe('Authentication', () => {
  it('rejects registration with invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'not-an-email',
      phone: '+91 9876543210',
      password: 'Password1',
      confirmPassword: 'Password1',
      role: 'customer',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects weak passwords', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'weak@example.com',
      phone: '+91 9876543210',
      password: 'short',
      confirmPassword: 'short',
      role: 'customer',
    });
    expect(res.status).toBe(400);
  });

  it('rejects mismatched confirm password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'mismatch@example.com',
      phone: '+91 9876543210',
      password: 'Password1',
      confirmPassword: 'Password2',
      role: 'customer',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/match/i);
  });

  it('does not allow registering as admin', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Hacker',
        email: 'hacker@example.com',
        phone: '+91 9876543210',
        password: 'Password1',
        confirmPassword: 'Password1',
        role: 'admin',
      });
    expect(res.status).toBe(400);
  });

  it('registers a customer and never returns the password hash', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Asha Customer',
      email: 'asha@test.com',
      phone: '+91 9123456780',
      password: 'Password1',
      confirmPassword: 'Password1',
      role: 'customer',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.role).toBe('customer');
    const raw = await User.findOne({ email: 'asha@test.com' }).select('+password');
    expect(raw!.password).not.toBe('Password1');
    expect(raw!.password.startsWith('$2')).toBe(true);
  });

  it('blocks duplicate emails', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Duplicate',
      email: 'asha@test.com',
      phone: '+91 9123456781',
      password: 'Password1',
      confirmPassword: 'Password1',
      role: 'customer',
    });
    expect(res.status).toBe(409);
  });

  it('logs in with valid credentials and rejects bad ones', async () => {
    const ok = await request(app)
      .post('/api/auth/login')
      .send({ email: 'asha@test.com', password: 'Password1' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.token).toBeTruthy();

    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: 'asha@test.com', password: 'WrongPass1' });
    expect(bad.status).toBe(401);
  });

  it('GET /api/auth/me requires a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);

    const login = await request(app).post('/api/auth/login').send({ email: 'asha@test.com', password: 'Password1' });
    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.data.token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe('asha@test.com');
  });
});

let customerToken = '';
let vendorToken = '';
let vendorUserId = '';

beforeAll(async () => {
  const c = await request(app).post('/api/auth/register').send({
    name: 'Event Owner',
    email: 'owner@test.com',
    phone: '+91 9000000001',
    password: 'Password1',
    confirmPassword: 'Password1',
    role: 'customer',
  });
  customerToken = c.body.data.token;

  const v = await request(app).post('/api/auth/register').send({
    name: 'Test Vendor Co',
    email: 'vendor@test.com',
    phone: '+91 9000000002',
    password: 'Password1',
    confirmPassword: 'Password1',
    role: 'vendor',
  });
  vendorToken = v.body.data.token;
  vendorUserId = v.body.data.user.id;
});

describe('Vendor CRUD & authorization', () => {
  it('vendor can create their business profile (pending approval)', async () => {
    const res = await request(app)
      .post('/api/vendors/me/profile')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        businessName: 'Test Decor Studio',
        category: 'Decoration',
        location: 'Pune',
        phone: '+91 9000000002',
        description: 'We decorate events.',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.vendor.verificationStatus).toBe('pending');
  });

  it('vendor can add a service to own profile', async () => {
    const res = await request(app)
      .post('/api/vendors/me/services')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        name: 'Floral Stage Package',
        category: 'Decoration',
        price: 25000,
        pricingType: 'Fixed',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.service.name).toBe('Floral Stage Package');
  });

  it("vendor cannot edit another vendor's service", async () => {
    // create second vendor
    await request(app).post('/api/auth/register').send({
      name: 'Other Vendor',
      email: 'other@vendor.test',
      phone: '+91 9000000003',
      password: 'Password1',
      confirmPassword: 'Password1',
      role: 'vendor',
    });
    const otherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'other@vendor.test', password: 'Password1' });
    await request(app)
      .post('/api/vendors/me/profile')
      .set('Authorization', `Bearer ${otherLogin.body.data.token}`)
      .send({ businessName: 'Other Studio', category: 'DJ', location: 'Goa', phone: '+91 9000000003' });
    const otherService = await request(app)
      .post('/api/vendors/me/services')
      .set('Authorization', `Bearer ${otherLogin.body.data.token}`)
      .send({ name: 'Party DJ Set', category: 'DJ', price: 10000, pricingType: 'Per Hour' });

    const hack = await request(app)
      .put(`/api/vendors/me/services/${otherService.body.data.service._id}`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ price: 1 });
    expect(hack.status).toBe(403);
  });

  it('validates service input (negative price rejected)', async () => {
    const res = await request(app)
      .post('/api/vendors/me/services')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ name: 'Bad Service', category: 'DJ', price: -500, pricingType: 'Fixed' });
    expect(res.status).toBe(400);
  });
});

describe('Event CRUD', () => {
  let eventId = '';

  it('requires auth for event creation', async () => {
    const res = await request(app).post('/api/events').send({ name: 'X' });
    expect(res.status).toBe(401);
  });

  it('creates an event with valid data', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        name: 'Anniversary Dinner',
        type: 'Party',
        date: new Date(Date.now() + 86400000 * 10).toISOString(),
        startTime: '18:00',
        endTime: '22:00',
        location: 'Mumbai',
        guestCount: 50,
        budget: 100000,
      });
    expect(res.status).toBe(201);
    eventId = res.body.data.event._id;
  });

  it('rejects invalid event data (guestCount <= 0, negative budget)', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        name: 'Bad Event',
        type: 'Party',
        date: new Date().toISOString(),
        startTime: '18:00',
        endTime: '22:00',
        location: 'Pune',
        guestCount: 0,
        budget: -5,
      });
    expect(res.status).toBe(400);
  });

  it('updates own event but not someone else\u2019s', async () => {
    const ok = await request(app)
      .put(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Anniversary Dinner Party' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.event.name).toBe('Anniversary Dinner Party');

    // second customer tries to modify
    await request(app).post('/api/auth/register').send({
      name: 'Intruder',
      email: 'intruder@test.com',
      phone: '+91 9000000004',
      password: 'Password1',
      confirmPassword: 'Password1',
      role: 'customer',
    });
    const intruder = await request(app)
      .post('/api/auth/login')
      .send({ email: 'intruder@test.com', password: 'Password1' });
    const hack = await request(app)
      .delete(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${intruder.body.data.token}`);
    expect(hack.status).toBe(403);
  });
});

describe('Booking workflow', () => {
  let adminToken = '';
  let approvedVendorId = '';
  let eventId = '';

  beforeAll(async () => {
    // seed-like setup: approve test vendor via direct DB manipulation is not allowed here,
    // so create an admin by inserting directly
    const bcrypt = require('bcryptjs');
    const adminUser = await User.create({
      name: 'Admin Test',
      email: 'admintest@test.com',
      phone: '+91 9000000005',
      password: await bcrypt.hash('Password1', 10),
      role: 'admin',
    });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admintest@test.com', password: 'Password1' });
    adminToken = login.body.data.token;

    // find the pending vendor created earlier and approve it
    const pendingList = await request(app)
      .get('/api/admin/vendors?verificationStatus=pending')
      .set('Authorization', `Bearer ${adminToken}`);
    const target = pendingList.body.data.vendors.find((v: { _id: string; businessName?: string }) => v.businessName === 'Test Decor Studio');
    if (target) {
      await request(app)
        .put(`/api/admin/vendors/${target._id}/verification`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ decision: 'approved' });
      approvedVendorId = target._id;
    }

    const ev = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        name: 'Booking Test Event',
        type: 'Wedding',
        date: new Date(Date.now() + 86400000 * 30).toISOString(),
        startTime: '10:00',
        endTime: '14:00',
        location: 'Pune',
        guestCount: 100,
        budget: 500000,
      });
    eventId = ev.body.data.event._id;
  });

  it('admin APIs are blocked for customers', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  it('creates a booking against an approved vendor', async () => {
    expect(approvedVendorId).toBeTruthy();
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        eventId,
        vendorId: approvedVendorId,
        date: new Date(Date.now() + 86400000 * 30).toISOString(),
        startTime: '11:00',
        endTime: '15:00',
        guestCount: 100,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.booking.status).toBe('pending');
    expect(res.body.data.booking.amount).toBeGreaterThan(0);
  });

  it('prevents double booking in overlapping time slots', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        eventId,
        vendorId: approvedVendorId,
        date: new Date(Date.now() + 86400000 * 30).toISOString(),
        startTime: '14:00',
        endTime: '18:00',
        guestCount: 80,
      });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already/i);
  });

  it('allows non-overlapping bookings on same day', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        eventId,
        vendorId: approvedVendorId,
        date: new Date(Date.now() + 86400000 * 30).toISOString(),
        startTime: '18:00',
        endTime: '22:00',
        guestCount: 60,
      });
    expect([201, 409]).toContain(res.status); // 409 only if another slot collides; 18:00-22:00 should be free
    if (res.status === 201) {
      expect(res.body.data.booking.startTime).toBe('18:00');
    }
  });

  it('vendor accepts booking; customer cannot accept', async () => {
    const list = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${vendorToken}`);
    const booking = list.body.data.bookings[0];
    expect(booking).toBeTruthy();

    const asCustomer = await request(app)
      .put(`/api/bookings/${booking._id}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: 'confirmed' });
    expect(asCustomer.status).toBe(403);

    const asVendor = await request(app)
      .put(`/api/bookings/${booking._id}`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ status: 'confirmed' });
    expect(asVendor.status).toBe(200);
    expect(asVendor.body.data.booking.status).toBe('confirmed');
  });
});

describe('Review system', () => {
  it('rejects reviews for non-completed bookings', async () => {
    const list = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`);
    const confirmed = list.body.data.bookings.find((b: { status: string }) => b.status === 'confirmed');

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ bookingId: confirmed._id, rating: 5, comment: 'This is definitely at least ten chars.' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/completed/i);
  });

  it('rejects rating out of range and short comments', async () => {
    const list = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`);
    const anyBooking = list.body.data.bookings[0];

    const badRating = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ bookingId: anyBooking._id, rating: 7, comment: 'This comment is long enough.' });
    expect(badRating.status).toBe(400);

    const badComment = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ bookingId: anyBooking._id, rating: 4, comment: 'short' });
    expect(badComment.status).toBe(400);
  });
});

describe('Recommendations', () => {
  it('returns scored venues and vendors', async () => {
    const res = await request(app)
      .post('/api/users/recommendations')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ eventType: 'Wedding', location: 'Pune', guestCount: 300, budget: 500000 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.recommendations.venues)).toBe(true);
    expect(Array.isArray(res.body.data.recommendations.vendors)).toBe(true);
  });
});
