# EventEase — Full-Stack Event Planning Platform

A full-stack event planning platform built with the MERN stack (MongoDB, Express.js, React, Node.js). EventEase enables customers to discover and book venues and vendors, manage events end-to-end, and provides vendors with a portal to manage their services and bookings. Includes a complete admin console for platform oversight.

## Features

**Customer Portal**
- Browse and search venues and vendors with rich filtering
- Create and manage events with guests, tasks, budgets, and bookings
- Personalized recommendations engine based on event type, location, and budget
- Payment flow with receipt tracking
- RSVP management for guests

**Vendor Portal**
- Manage business profile, availability, and services
- Accept/reject/complete bookings
- View and respond to customer reviews
- Performance dashboard with booking and revenue stats

**Admin Console**
- Platform-wide dashboard with charts (users, revenue, bookings, reviews)
- User management (suspend/activate accounts)
- Vendor verification (approve/reject pending vendors)
- Venue, event, booking, and payment oversight
- Review moderation

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 19, TypeScript, Tailwind CSS, Recharts, React Router v7 |
| Backend  | Node.js, Express.js, TypeScript, Zod validation |
| Database | MongoDB with Mongoose |
| Auth     | JWT (JSON Web Tokens) |
| Build    | Vite (client), tsc (server) |
| Tests    | Vitest, mongodb-memory-server |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
git clone <repo-url>
cd eventease

# Install server dependencies
cd server
cp .env.example .env      # edit with your values
npm install

# Install client dependencies
cd ../client
npm install
```

### Seed the Database

```bash
cd server
npm run seed
```

### Running Development Servers

```bash
# Terminal 1 — API server (port 5001)
cd server
npm run dev

# Terminal 2 — Client dev server (port 5173, proxies /api → 5001)
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Demo Accounts

| Role     | Email                    | Password      |
|----------|--------------------------|---------------|
| Admin    | admin@eventease.in       | Admin@123     |
| Customer | priya@example.com        | Customer@123  |
| Vendor   | sharma@catering.example.com | Vendor@123 |

### Production Build

```bash
cd client && npm run build    # outputs to client/dist/
cd server && npm run build    # outputs to server/dist/
```

### Running Tests

```bash
cd server
npm test
```

## API Overview

All endpoints are prefixed with `/api`. Key resource groups:

| Route prefix         | Purpose                            |
|----------------------|------------------------------------|
| `/api/auth`          | Register, login, profile update    |
| `/api/vendors`       | Vendor CRUD, availability, reviews |
| `/api/venues`        | Venue listing and detail           |
| `/api/events`        | Event CRUD with guests/tasks       |
| `/api/bookings`      | Booking lifecycle (pay/cancel)     |
| `/api/payments`      | Payment processing and receipts    |
| `/api/reviews`       | Review CRUD with moderation        |
| `/api/users`         | Dashboard, search, recommendations |
| `/api/admin`         | Admin-only management endpoints    |
| `/api/notifications` | User notifications                 |

## Project Structure

```
eventease/
├── client/                # React SPA (Vite)
│   └── src/
│       ├── components/    # Reusable UI (Cards, Forms, Modals)
│       ├── context/       # Auth context (JWT storage)
│       ├── layouts/       # MainLayout, DashboardLayout
│       ├── pages/         # Route pages (public + portal)
│       ├── services/      # Axios API client
│       ├── types/         # TypeScript interfaces
│       └── utils/         # Formatting helpers
├── server/                # Express API
│   └── src/
│       ├── config/        # DB connection
│       ├── controllers/   # Request handlers
│       ├── middleware/     # Auth, error handling
│       ├── models/        # Mongoose schemas
│       ├── routes/        # Express routers
│       ├── services/      # Business logic
│       ├── validators/    # Zod schemas
│       └── seed/          # Database seeder
└── README.md
```

## License

MIT
