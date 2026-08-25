/* eslint-disable no-console */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { User } from '../models/User';
import { Vendor } from '../models/Vendor';
import { Venue } from '../models/Venue';
import { Service } from '../models/Service';
import { Event } from '../models/Event';
import { Booking } from '../models/Booking';
import { Review } from '../models/Review';
import { Guest } from '../models/Guest';
import { Task } from '../models/Task';
import { Expense } from '../models/Expense';
import { Payment } from '../models/Payment';
import { Notification } from '../models/Notification';

const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/600`;

const CITIES = ['Bangalore', 'Delhi', 'Mumbai', 'Hyderabad', 'Pune', 'Chennai', 'Noida', 'Ghaziabad'];

const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const futureDate = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
};

const pastDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
};

async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function seed(): Promise<void> {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/eventease';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // Wipe collections
  await Promise.all([
    User.deleteMany({}), Vendor.deleteMany({}), Venue.deleteMany({}),
    Service.deleteMany({}), Event.deleteMany({}), Booking.deleteMany({}),
    Review.deleteMany({}), Guest.deleteMany({}), Task.deleteMany({}),
    Expense.deleteMany({}), Payment.deleteMany({}), Notification.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // ---------- USERS ----------
  const adminPass = await hash('Admin@123');
  const customerPass = await hash('Customer@123');
  const vendorPass = await hash('Vendor@123');

  const admin = await User.create({
    name: 'EventEase Admin',
    email: 'admin@eventease.in',
    phone: '+91 9800000001',
    password: adminPass,
    role: 'admin',
    profileImage: img('admin-face'),
  });

  const customerData = [
    { name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 9845012345', city: 'Bangalore' },
    { name: 'Rahul Verma', email: 'rahul@example.com', phone: '+91 9910023456', city: 'Delhi' },
    { name: 'Ananya Iyer', email: 'ananya@example.com', phone: '+91 9820034567', city: 'Mumbai' },
    { name: 'Karthik Reddy', email: 'karthik@example.com', phone: '+91 9963045678', city: 'Hyderabad' },
    { name: 'Sneha Patil', email: 'sneha@example.com', phone: '+91 9765056789', city: 'Pune' },
  ];

  const customers = await User.create(
    customerData.map((c, i) => ({
      name: c.name,
      email: c.email,
      phone: c.phone,
      password: customerPass,
      role: 'customer',
      profileImage: img(`customer-${i}`),
    }))
  );
  console.log(`${customers.length + 1} users (1 admin, ${customers.length} customers)`);

  // ---------- VENDORS ----------
  const vendorData = [
    {
      user: { name: 'Sharma Caterers', email: 'sharma@catering.example.com' },
      businessName: 'Sharma Catering Co.',
      category: 'Catering',
      description: 'Serving authentic North Indian and continental cuisine for weddings and corporate events since 1998. Live counters, chaat stations and premium buffets available.',
      location: 'Delhi',
      startingPrice: 450,
    },
    {
      user: { name: 'Pixel Wedding Films', email: 'pixel@photo.example.com' },
      businessName: 'Pixel Wedding Films',
      category: 'Photography',
      description: 'Award-winning candid wedding photography and cinematic films. We capture emotions, not just moments.',
      location: 'Bangalore',
      startingPrice: 35000,
    },
    {
      user: { name: 'Bloom & Drape Decorators', email: 'bloom@decor.example.com' },
      businessName: 'Bloom & Drape Decor',
      category: 'Decoration',
      description: 'Luxury floral decor, stage design and theme setups for weddings, sangeet and corporate galas.',
      location: 'Mumbai',
      startingPrice: 50000,
    },
    {
      user: { name: 'DJ Aarav Sounds', email: 'aarav@dj.example.com' },
      businessName: 'DJ Aarav Sound Systems',
      category: 'DJ',
      description: 'High-energy DJ sets with JBL professional sound, LED walls, fog machines and dance floor lighting.',
      location: 'Hyderabad',
      startingPrice: 18000,
    },
    {
      user: { name: 'Ganesh Travels', email: 'ganesh@travel.example.com' },
      businessName: 'Ganesh Travels & Logistics',
      category: 'Transportation',
      description: 'Premium fleet of Innova Crysta, Tempo Travellers and luxury buses for guest transport across South India.',
      location: 'Chennai',
      startingPrice: 6500,
    },
  ];

  const vendorUsers = await User.create(
    vendorData.map((v, i) => ({
      name: v.user.name,
      email: v.user.email,
      phone: `+91 90${String(10000000 + i * 111111).slice(0, 8)}`,
      password: vendorPass,
      role: 'vendor' as const,
      profileImage: img(`vendor-user-${i}`),
    }))
  );

  const vendors = [];
  for (let i = 0; i < vendorData.length; i++) {
    const v = vendorData[i];
    // First 4 approved, last one pending approval to demo admin workflow
    const approved = i < 4;
    vendors.push(
      await Vendor.create({
        userId: vendorUsers[i]._id,
        businessName: v.businessName,
        category: v.category,
        description: v.description,
        location: v.location,
        phone: vendorUsers[i].phone,
        email: v.user.email,
        profileImage: img(`vendor-${i}`),
        portfolio: [img(`portfolio-${i}-1`), img(`portfolio-${i}-2`), img(`portfolio-${i}-3`)],
        startingPrice: v.startingPrice,
        verified: approved,
        verificationStatus: approved ? 'approved' : 'pending',
      })
    );
  }
  console.log(`${vendors.length} vendors`);

  // ---------- SERVICES ----------
  const servicePlans: Array<{ vendorIdx: number; name: string; description: string; price: number; pricingType: 'Fixed' | 'Per Person' | 'Per Hour' | 'Custom Quote'; duration?: string }> = [
    { vendorIdx: 0, name: 'Royal Wedding Buffet (Veg + Non-Veg)', description: 'Welcome drinks, 4 starters, main course with live counters and 6 desserts. Serves up to 500 guests.', price: 850, pricingType: 'Per Person', duration: 'Full day' },
    { vendorIdx: 0, name: 'Corporate Lunch Package', description: 'Executive buffet lunch with 2 starters, 4 mains, breads, rice, dessert. Ideal for office events.', price: 450, pricingType: 'Per Person', duration: '3 hours' },
    { vendorIdx: 1, name: 'Full-Day Candid Wedding Coverage', description: 'Two photographers covering haldi to reception. 400+ edited photos delivered in 15 days.', price: 55000, pricingType: 'Fixed', duration: '12 hours' },
    { vendorIdx: 1, name: 'Pre-Wedding Photoshoot', description: 'Half-day outdoor shoot at a scenic Bengaluru location with 60 edited photos and an album.', price: 25000, pricingType: 'Fixed', duration: '5 hours' },
    { vendorIdx: 2, name: 'Grand Mandap & Stage Decor', description: 'Fresh flower mandap, drapes, chandeliers and entrance arch. Custom themes available.', price: 150000, pricingType: 'Fixed', duration: 'Setup 1 day before' },
    { vendorIdx: 2, name: 'Birthday Theme Decoration', description: 'Balloons, backdrop, cake table styling and LED name setup for home or banquet parties.', price: 12000, pricingType: 'Fixed', duration: '3 hours' },
    { vendorIdx: 3, name: 'Sangeet Night DJ Package', description: '4-hour DJ set, JBL sound system, intelligent lighting and emcee on request.', price: 22000, pricingType: 'Per Hour', duration: 'Minimum 4 hours' },
    { vendorIdx: 3, name: 'College Fest Main Stage', description: 'Full concert rig with line array speakers, moving heads and smoke machines.', price: 65000, pricingType: 'Custom Quote', duration: 'Event day' },
    { vendorIdx: 4, name: 'Guest Pickup & Drop Fleet', description: 'Airport transfers for outstation guests with uniformed chauffeurs. 5 vehicles included.', price: 9500, pricingType: 'Fixed', duration: 'Per event day' },
    { vendorIdx: 4, name: 'Luxury Bus Hire (45-seater)', description: 'AC Volvo bus with reclining seats for group outings and baraat transport.', price: 14000, pricingType: 'Per Hour', duration: 'Minimum 6 hours' },
  ];

  const services = [];
  for (const s of servicePlans) {
    services.push(
      await Service.create({
        vendorId: vendors[s.vendorIdx]._id,
        name: s.name,
        description: s.description,
        category: vendors[s.vendorIdx].category,
        price: s.price,
        pricingType: s.pricingType,
        duration: s.duration ?? '',
        images: [img(`service-${services.length}`)],
      })
    );
  }
  console.log(`${services.length} services`);

  // ---------- VENUES ----------
  const venueData = [
    { name: 'The Leela Palace Lawns', location: 'Bangalore', capacity: 800, price: 350000, facilities: ['Parking', 'AC', 'WiFi', 'In-house Catering', 'Stage', 'Valet Parking', 'Green Rooms'], desc: 'Palatial lawns overlooking a lake, perfect for royal weddings.' },
    { name: 'Taj Convention Centre', location: 'Hyderabad', capacity: 1200, price: 500000, facilities: ['Parking', 'AC', 'WiFi', 'In-house Catering', 'Stage', 'Sound System', 'Projector'], desc: 'Five-star convention halls for conferences and grand receptions.' },
    { name: 'Umaid Lake Palace', location: 'Delhi', capacity: 600, price: 420000, facilities: ['Parking', 'AC', 'Garden Area', 'Swimming Pool', 'Valet Parking', 'Bar'], desc: 'Heritage palace venue with manicured gardens and lake views.' },
    { name: 'Sun-n-Sand Beachside Resort', location: 'Mumbai', capacity: 400, price: 280000, facilities: ['Parking', 'AC', 'WiFi', 'Garden Area', 'Swimming Pool', 'Bar', 'Power Backup'], desc: 'Beachfront resort for destination weddings and sunset parties.' },
    { name: 'Phoenix Grand Banquets', location: 'Pune', capacity: 350, price: 120000, facilities: ['Parking', 'AC', 'In-house Catering', 'Stage', 'Lift', 'Power Backup'], desc: 'Elegant pillarless banquet hall in the heart of Pune.' },
    { name: 'Marina Bay Convention Hall', location: 'Chennai', capacity: 900, price: 300000, facilities: ['Parking', 'AC', 'WiFi', 'Stage', 'Sound System', 'Projector', 'Green Rooms'], desc: 'Modern sea-facing convention centre for corporate summits.' },
    { name: 'Skyline Terrace Noida', location: 'Noida', capacity: 250, price: 85000, facilities: ['Parking', 'AC', 'WiFi', 'Sound System', 'Lift', 'Bar'], desc: 'Rooftop terrace with skyline views, ideal for cocktail parties.' },
    { name: 'Riverside Farms Ghaziabad', location: 'Ghaziabad', capacity: 1000, price: 200000, facilities: ['Parking', 'Garden Area', 'Stage', 'Sound System', 'Power Backup', 'Green Rooms'], desc: 'Sprawling farmstead on the banks of Hindon for big fat Indian weddings.' },
    { name: 'Emerald Business Park Auditorium', location: 'Bangalore', capacity: 500, price: 150000, facilities: ['Parking', 'AC', 'WiFi', 'Projector', 'Sound System', 'Lift'], desc: 'Tech-forward auditorium for product launches and tech conferences.' },
    { name: 'Celebration Sports Arena', location: 'Hyderabad', capacity: 700, price: 180000, facilities: ['Parking', 'Floodlights', 'Sound System', 'Power Backup', 'First Aid Room'], desc: 'Multi-purpose arena for sports meets and college fests.' },
  ];

  const venues = [];
  for (let i = 0; i < venueData.length; i++) {
    const v = venueData[i];
    venues.push(
      await Venue.create({
        name: v.name,
        description: `${v.desc} Features ${v.facilities.slice(0, 3).join(', ').toLowerCase()} and more.`,
        location: v.location,
        address: `${randInt(1, 50)}, ${['MG Road', 'Banjara Hills', 'Sector 62', 'Andheri West', 'Koregaon Park'][i % 5]}, ${v.location}`,
        capacity: v.capacity,
        price: v.price,
        facilities: v.facilities,
        images: [img(`venue-${i}-a`), img(`venue-${i}-b`), img(`venue-${i}-c`), img(`venue-${i}-d`)],
        rating: 0,
        reviewCount: 0,
        verificationStatus: 'approved',
      })
    );
  }
  console.log(`${venues.length} venues`);

  // ---------- EVENTS ----------
  const eventData = [
    { owner: 0, name: 'Sharma-Kapoor Wedding', type: 'Wedding', date: futureDate(45), guests: 350, budget: 800000, location: 'Bangalore', status: 'upcoming', desc: 'Traditional South Indian wedding followed by a grand reception.' },
    { owner: 0, name: "Aarav's 1st Birthday", type: 'Birthday', date: futureDate(20), guests: 60, budget: 75000, location: 'Bangalore', status: 'planning', desc: 'Jungle-themed first birthday party for our little one.' },
    { owner: 1, name: 'TechSummit India 2026', type: 'Conference', date: futureDate(60), guests: 500, budget: 1500000, location: 'Delhi', status: 'planning', desc: 'Annual technology conference with keynote speakers and workshops.' },
    { owner: 1, name: 'Diwali Corporate Gala', type: 'Corporate Event', date: futureDate(30), guests: 200, budget: 400000, location: 'Delhi', status: 'upcoming', desc: 'Annual Diwali celebration for Verma Industries employees.' },
    { owner: 2, name: 'Iyer-Mehta Engagement', type: 'Party', date: futureDate(15), guests: 120, budget: 250000, location: 'Mumbai', status: 'upcoming', desc: 'Ring ceremony followed by dinner and dance.' },
    { owner: 2, name: 'Annual Family Getaway', type: 'Other', date: pastDate(40), guests: 45, budget: 150000, location: 'Mumbai', status: 'completed', desc: 'Three-day family reunion at a beachside resort.' },
    { owner: 3, name: 'Inter-College Cultural Fest', type: 'Cultural Event', date: futureDate(50), guests: 800, budget: 500000, location: 'Hyderabad', status: 'planning', desc: 'Two-day fest with music, dance and drama competitions.' },
    { owner: 3, name: 'Reddy Cricket Tournament', type: 'Sports Event', date: pastDate(20), guests: 150, budget: 100000, location: 'Hyderabad', status: 'completed', desc: 'Corporate cricket league finals with prize distribution.' },
    { owner: 4, name: 'Patil Wedding Reception', type: 'Wedding', date: futureDate(75), guests: 280, budget: 650000, location: 'Pune', status: 'planning', desc: 'Reception for 280 guests with live band and sangeet.' },
    { owner: 4, name: "Sneha's Graduation Party", type: 'Birthday', date: pastDate(10), guests: 40, budget: 50000, location: 'Pune', status: 'completed', desc: 'Intimate celebration for engineering graduation.' },
  ];

  const times = [
    { start: '10:00', end: '14:00' }, { start: '18:00', end: '23:00' },
    { start: '09:00', end: '17:00' }, { start: '16:00', end: '21:00' },
    { start: '11:00', end: '15:00' },
  ];

  const events = [];
  for (let i = 0; i < eventData.length; i++) {
    const e = eventData[i];
    const t = times[i % times.length];
    events.push(
      await Event.create({
        userId: customers[e.owner]._id,
        name: e.name,
        type: e.type,
        description: e.desc,
        date: e.date,
        startTime: t.start,
        endTime: t.end,
        location: e.location,
        guestCount: e.guests,
        budget: e.budget,
        image: img(`event-${i}`),
        status: e.status,
      })
    );
  }
  console.log(`${events.length} events`);

  // ---------- GUESTS ----------
  const firstNames = ['Amit', 'Deepika', 'Rohan', 'Kavya', 'Arjun', 'Meera', 'Vikram', 'Pooja', 'Sanjay', 'Divya', 'Nikhil', 'Riya', 'Aditya', 'Shreya', 'Manish', 'Tanvi', 'Harsh', 'Ishita', 'Varun', 'Neha'];
  const lastNames = ['Patel', 'Gupta', 'Singh', 'Nair', 'Desai', 'Joshi', 'Rao', 'Malhotra', 'Kulkarni', 'Menon'];

  let guestCount = 0;
  for (let i = 0; i < events.length; i++) {
    const perEvent = 3;
    for (let g = 0; g < perEvent; g++) {
      const fn = rand(firstNames);
      const ln = rand(lastNames);
      const rsvp = rand(['confirmed', 'pending', 'declined'] as const);
      await Guest.create({
        eventId: events[i]._id,
        name: `${fn} ${ln}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}${randInt(1, 99)}@example.com`,
        phone: `+91 9${randInt(100000000, 999999999)}`,
        guestCount: randInt(1, 4),
        rsvpStatus: rsvp,
        notes: rsvp === 'declined' ? 'Cannot travel' : '',
      });
      guestCount++;
    }
  }
  console.log(`${guestCount} guests`);

  // ---------- TASKS ----------
  const taskTemplates = [
    { title: 'Guest Arrival & Welcome Drinks', hoursAgoStart: 0 },
    { title: 'Welcome Ceremony & Garlands', hoursAgoStart: 1 },
    { title: 'Lunch / Dinner Service', hoursAgoStart: 3 },
    { title: 'Main Ceremony / Keynote', hoursAgoStart: 4 },
    { title: 'Photography Session', hoursAgoStart: 6 },
    { title: 'Cake Cutting & Toast', hoursAgoStart: 7 },
  ];

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const isPast = new Date(ev.date) < new Date();
    for (let t = 0; t < 4; t++) {
      const tpl = taskTemplates[(t + i) % taskTemplates.length];
      const startH = 10 + t * 2;
      const status = isPast ? 'completed' : t === 0 ? 'in-progress' : 'pending';
      await Task.create({
        eventId: ev._id,
        title: tpl.title,
        description: `Coordinated by the events team for ${ev.name}.`,
        date: ev.date,
        startTime: `${String(startH).padStart(2, '0')}:00`,
        endTime: `${String(startH + 1).padStart(2, '0')}:30`,
        assignedTo: rand(['Priya', 'Ramesh (Coordinator)', 'Volunteer Team A', 'Family Member']),
        status,
      });
    }
  }
  console.log('Tasks created');

  // ---------- BOOKINGS ----------
  interface BookingPlan {
    eventIdx: number; vendorIdx?: number; venueIdx?: number; serviceIdx?: number;
    status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'; paid?: boolean;
  }

  const bookingPlans: BookingPlan[] = [
    { eventIdx: 0, venueIdx: 0, status: 'confirmed', paid: true },
    { eventIdx: 0, vendorIdx: 1, serviceIdx: 2, status: 'completed', paid: true },
    { eventIdx: 0, vendorIdx: 0, serviceIdx: 0, status: 'confirmed', paid: true },
    { eventIdx: 0, vendorIdx: 2, serviceIdx: 4, status: 'pending' },
    { eventIdx: 1, vendorIdx: 2, serviceIdx: 5, status: 'confirmed', paid: true },
    { eventIdx: 1, vendorIdx: 3, serviceIdx: 6, status: 'completed', paid: true },
    { eventIdx: 2, venueIdx: 8, status: 'pending' },
    { eventIdx: 2, vendorIdx: 0, serviceIdx: 1, status: 'rejected' },
    { eventIdx: 3, venueIdx: 1, status: 'cancelled' },
    { eventIdx: 3, vendorIdx: 3, serviceIdx: 7, status: 'confirmed', paid: true },
    { eventIdx: 4, venueIdx: 3, status: 'completed', paid: true },
    { eventIdx: 4, vendorIdx: 1, serviceIdx: 3, status: 'completed', paid: true },
    { eventIdx: 5, venueIdx: 3, status: 'completed', paid: true },
    { eventIdx: 5, vendorIdx: 0, serviceIdx: 0, status: 'completed', paid: true },
    { eventIdx: 5, vendorIdx: 1, serviceIdx: 2, status: 'completed', paid: true },
    { eventIdx: 6, venueIdx: 9, status: 'pending' },
    { eventIdx: 6, vendorIdx: 3, serviceIdx: 7, status: 'completed', paid: true },
    { eventIdx: 6, vendorIdx: 4, serviceIdx: 9, status: 'confirmed', paid: true },
    { eventIdx: 7, venueIdx: 9, status: 'completed', paid: true },
    { eventIdx: 7, vendorIdx: 4, serviceIdx: 8, status: 'completed', paid: true },
    { eventIdx: 8, venueIdx: 4, status: 'confirmed', paid: true },
    { eventIdx: 8, vendorIdx: 1, serviceIdx: 2, status: 'completed', paid: true },
    { eventIdx: 9, venueIdx: 4, status: 'completed', paid: true },
    { eventIdx: 9, vendorIdx: 2, serviceIdx: 5, status: 'completed', paid: true },
    { eventIdx: 2, vendorIdx: 3, serviceIdx: 6, status: 'completed', paid: true },
    { eventIdx: 6, vendorIdx: 0, serviceIdx: 0, status: 'completed', paid: true },
  ];

  const bookings = [];
  let txnCounter = 1;
  for (const plan of bookingPlans) {
    const ev = events[plan.eventIdx];
    const isPast = plan.status === 'completed';
    const bDate = isPast ? pastDate(randInt(5, 35)) : ev.date;
    const t = times[randInt(0, times.length - 1)];

    let amount = 0;
    if (plan.vendorIdx !== undefined) {
      if (plan.serviceIdx !== undefined && services[plan.serviceIdx]) {
        const svc = services[plan.serviceIdx];
        switch (svc.pricingType) {
          case 'Per Person': amount = svc.price * Math.min(ev.guestCount, 300); break;
          case 'Per Hour': amount = svc.price * 4; break;
          default: amount = svc.price;
        }
      } else {
        amount = vendors[plan.vendorIdx!].startingPrice;
      }
    } else if (plan.venueIdx !== undefined) {
      amount = venues[plan.venueIdx].price;
    }

    const booking = await Booking.create({
      customerId: ev.userId,
      eventId: ev._id,
      vendorId: plan.vendorIdx !== undefined ? vendors[plan.vendorIdx]._id : undefined,
      venueId: plan.venueIdx !== undefined ? venues[plan.venueIdx]._id : undefined,
      serviceId: plan.serviceIdx !== undefined ? services[plan.serviceIdx]._id : undefined,
      date: bDate,
      startTime: t.start,
      endTime: t.end,
      guestCount: ev.guestCount,
      amount,
      status: plan.status,
      paymentStatus: plan.paid ? 'paid' : 'unpaid',
      notes: '',
    });
    bookings.push(booking);

    if (plan.paid) {
      await Payment.create({
        bookingId: booking._id,
        customerId: ev.userId,
        amount,
        paymentMethod: rand(['card', 'upi', 'netbanking']),
        transactionId: `TXN1700${String(txnCounter++).padStart(4, '0')}`,
        status: 'successful',
        createdAt: bDate,
      });
    }
  }
  console.log(`${bookings.length} bookings`);

  // ---------- REVIEWS (only completed bookings, one per booking) ----------
  const completedBookings = bookings.filter((b) => b.status === 'completed');
  const comments = [
    'Excellent service from start to finish. The team arrived early and everything ran like clockwork.',
    'Food was outstanding — guests are still talking about the dessert counter two weeks later!',
    'Beautiful decoration work. They turned our simple hall into a dream venue.',
    'Very professional crew, great sound quality and the DJ kept everyone on the dance floor.',
    'Photographs came out stunning. Candid shots captured moments we will treasure forever.',
    'Smooth coordination and polite staff. Would definitely book again for family functions.',
    'Good value for money though arrival was slightly delayed. Overall satisfied.',
    'The venue was spotless and staff were extremely helpful with seating arrangements.',
    'Amazing experience! The team handled last-minute changes without any fuss.',
    'Decent service overall. Some communication gaps initially but resolved quickly.',
    'Transport fleet was clean, drivers punctual. Our elderly guests were very comfortable.',
    'The pre-wedding shoot was so much fun. Photographer knew all the best angles and spots.',
    'Buffet variety was impressive and hygienic. Highly recommended for large gatherings.',
    'Stage decor exceeded expectations — the fresh flowers smelled divine!',
    'Professional team with creative ideas. The theme came alive beautifully.',
    'Great energy and equipment quality. Crowd loved every minute of the set.',
    'Reliable service. Booking process was transparent with no hidden charges.',
    'Wonderful hospitality. The manager personally supervised all arrangements.',
    'Photos were delivered ahead of schedule. The album design was classy.',
    'Venue capacity claims are accurate and AC worked perfectly even at full occupancy.',
  ];
  const responses = [
    'Thank you so much for the kind words! It was a pleasure serving you. 🙏',
    'We are thrilled you enjoyed it! Looking forward to your next event.',
    'Grateful for your feedback — our team will be delighted to read this.',
  ];

  for (let i = 0; i < Math.min(20, completedBookings.length); i++) {
    const b = completedBookings[i];
    const stars = [5, 5, 5, 5, 4, 4, 4, 5, 3, 5][i % 10];
    await Review.create({
      customerId: b.customerId,
      bookingId: b._id,
      vendorId: b.vendorId ?? undefined,
      venueId: b.venueId ?? undefined,
      rating: stars,
      comment: comments[i % comments.length],
      response: i % 4 === 0 ? responses[i % responses.length] : '',
      createdAt: pastDate(randInt(1, 20)),
    });
  }

  // Recalculate ratings from actual reviews
  for (const v of vendors) {
    const stats = await Review.aggregate([
      { $match: { vendorId: v._id, status: 'visible' } },
      { $group: { _id: '$vendorId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    v.rating = stats.length ? Math.round(stats[0].avg * 10) / 10 : 0;
    v.reviewCount = stats.length ? stats[0].count : 0;
    await v.save();
  }
  for (const vn of venues) {
    const stats = await Review.aggregate([
      { $match: { venueId: vn._id, status: 'visible' } },
      { $group: { _id: '$venueId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    vn.rating = stats.length ? Math.round(stats[0].avg * 10) / 10 : 0;
    vn.reviewCount = stats.length ? stats[0].count : 0;
    await vn.save();
  }
  console.log('20 reviews + ratings recalculated');

  // ---------- EXPENSES ----------
  for (const ev of events) {
    const evExpenses = bookings.filter((b) => String(b.eventId) === String(ev._id));
    const catMap: Record<string, number> = {};
    for (const b of evExpenses) {
      if (b.paymentStatus !== 'paid') continue;
      let cat = 'Miscellaneous';
      if (b.venueId) cat = 'Venue';
      else if (b.vendorId) {
        const vd = vendors.find((v) => String(v._id) === String(b.vendorId));
        if (vd?.category === 'Catering') cat = 'Catering';
        else if (vd?.category === 'Decoration') cat = 'Decoration';
        else if (vd?.category === 'Photography') cat = 'Photography';
        else if (vd?.category === 'DJ' || vd?.category === 'Music') cat = 'Music';
        else if (vd?.category === 'Transportation') cat = 'Transportation';
      }
      catMap[cat] = (catMap[cat] || 0) + b.amount;
    }
    for (const [cat, amt] of Object.entries(catMap)) {
      await Expense.create({
        eventId: ev._id,
        category: cat,
        description: `${cat} payment for ${ev.name}`,
        amount: amt,
        date: pastDate(randInt(3, 30)),
      });
    }
  }
  console.log('Expenses created');

  // ---------- NOTIFICATIONS ----------
  for (const c of customers) {
    await Notification.create({
      userId: c._id,
      title: 'Welcome to EventEase 🎉',
      message: 'Start planning your perfect event today. Create an event and discover venues & vendors.',
      type: 'system',
    });
  }
  for (const vu of vendorUsers) {
    await Notification.create({
      userId: vu._id,
      title: 'Vendor account created',
      message: 'Complete your profile, add services and manage availability to receive bookings.',
      type: 'system',
    });
  }
  await Notification.create({
    userId: admin._id,
    title: 'Pending approvals',
    message: '1 vendor profile is awaiting verification.',
    type: 'system',
    link: '/admin/vendors',
  });
  console.log('Notifications created');

  console.log('\n✅ Seed complete!');
  console.log('──────────────────────────────────────────────');
  console.log('Demo accounts:');
  console.log('  Admin    → admin@eventease.in / Admin@123');
  console.log('  Customer → priya@example.com   / Customer@123');
  console.log('  Customer → rahul@example.com   / Customer@123');
  console.log('  Vendor   → sharma@catering.example.com / Vendor@123');
  console.log('  Vendor   → pixel@photo.example.com     / Vendor@123');
  console.log('──────────────────────────────────────────────');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
