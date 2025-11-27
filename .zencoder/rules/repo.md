---
description: Repository Information Overview
alwaysApply: true
---

# MetroWayz Repository Information

## Summary

MetroWayz is a full-stack lifestyle services platform built with React, TypeScript, and Node.js. It enables users to book multiple services including car rentals, accommodations, private chefs, food delivery, and entertainment through a unified platform. The application features a modern UI with smooth animations, advanced search capabilities, and integrated payment processing.

## Repository Structure

```
metrowayz/
├── src/                    # React frontend source
│   ├── components/         # React components (auth, booking, UI, vendor, admin)
│   ├── pages/              # Route pages (home, search, booking, payment, etc.)
│   ├── services/           # API and auth services
│   ├── hooks/              # Custom React hooks
│   ├── context/            # React context providers
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── config/             # Configuration (Paystack)
│   ├── data/               # Mock data
│   ├── App.tsx             # Root app component
│   ├── main.tsx            # Vite entry point
│   └── index.css            # Global styles
├── backend/                # Express backend structure
│   ├── controllers/        # Route controllers
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   └── config/             # Backend config
├── model/                  # MongoDB data models (Mongoose)
│   ├── User.js
│   ├── Service.js
│   ├── Booking.js
│   ├── Review.js
│   ├── Event.js
│   ├── Favorite.js
│   └── Notification.js
├── server.js               # Express server entrypoint
├── index.js                # Node.js entry for deployment
├── vite.config.ts          # Vite build config
├── tsconfig.json           # TypeScript config
├── tailwind.config.js      # Tailwind CSS theme
├── package.json            # Dependencies and scripts
└── public/                 # Static assets
```

## Language & Runtime

**Frontend Language**: TypeScript  
**Frontend Version**: TypeScript 5.2.2  
**Frontend Runtime**: Node.js (development with Vite)  
**Target**: ES2020  
**Build Tool**: Vite 5.4.20

**Backend Language**: JavaScript (Node.js)  
**Backend Runtime**: Node.js  
**Database**: MongoDB with Mongoose 8.0.3

## Dependencies

### Main Dependencies

**Frontend (React 18.2.0)**:
- `react-router-dom` (6.20.1) - Client-side routing
- `@tanstack/react-query` (5.8.4) - State management and data fetching
- `react-hook-form` (7.48.2) - Form state management
- `react-leaflet` (4.2.1) - Map integration
- `framer-motion` (10.16.5) - Animation library
- `lucide-react` (0.294.0) - Icon library
- `react-paystack` (6.0.0) - Payment integration
- `react-hot-toast` (2.6.0) - Toast notifications

**Styling**:
- `tailwindcss` (3.3.5) - Utility-first CSS
- `tailwind-merge` (2.0.0) - Tailwind class merging
- `autoprefixer` (10.4.16) - CSS vendor prefixes

**Backend**:
- `express` (4.18.2) - Web framework
- `mongoose` (8.0.3) - MongoDB ODM
- `cors` (2.8.5) - CORS middleware
- `jsonwebtoken` (9.0.2) - JWT authentication
- `passport` (0.7.0) & `passport-google-oauth20` (2.0.0) - OAuth integration
- `nodemailer` (6.9.7) - Email service
- `cloudinary` (1.41.0) - Image hosting
- `react-paystack` (6.0.0) - Payment processing

**Utilities**:
- `date-fns` (2.30.0) - Date manipulation
- `dotenv` (16.3.1) - Environment variables
- `body-parser` (1.20.2) - Request parsing
- `cookie-parser` (1.4.6) - Cookie handling
- `morgan` (1.10.0) - HTTP logging
- `express-rate-limit` (7.1.5) - Rate limiting
- `node-cron` (3.0.3) - Scheduled tasks

### Development Dependencies

- `@types/react` (18.2.37)
- `@types/react-dom` (18.2.15)
- `@types/leaflet` (1.9.21)
- `@typescript-eslint/eslint-plugin` (6.10.0)
- `@typescript-eslint/parser` (6.10.0)
- `@vitejs/plugin-react` (4.1.1)
- `eslint` (8.53.0)
- `eslint-plugin-react-hooks` (4.6.0)
- `eslint-plugin-react-refresh` (0.4.4)

## Build & Installation

```bash
# Install dependencies
npm install

# Development
npm run dev          # Start Vite dev server (port 3000)
npm run server       # Start Express server (port 3000)

# Production build
npm run build        # TypeScript check + Vite build

# Linting
npm run lint         # ESLint with strict configuration

# Preview built application
npm run preview      # Serve dist/ directory
```

## Docker Configuration

No Dockerfile found. Application is deployed via Vercel (frontend) and Render (backend).

## Main Entry Points

**Frontend**: 
- `src/main.tsx` - React app entry point with React Query and Router setup
- `src/App.tsx` - Root component with routes

**Backend**:
- `server.js` - Express server (170 KB, handles all backend operations)
- `index.js` - Node.js entry point for deployment platforms

**Key Pages**:
- Home (HomePage.tsx) - Service categories and featured services
- Search (SearchPage.tsx) - Service discovery with filters
- Service Details (ServiceDetailsPage.tsx) - Detailed service information
- Booking (BookingPage.tsx) - Booking flow with date/guest selection
- Payment (PaymentPage.tsx) - Paystack payment integration
- My Bookings (BookingsPage.tsx) - User booking management
- Profile (ProfilePage.tsx) - User profile management
- Vendor Dashboard (VendorLoginPage.tsx, vendor components)
- Super Admin Dashboard (super-admin components)

## Configuration

**Environment Variables** (`.env`):
- `VITE_API_BASE_URL` - Frontend API endpoint (default: https://metrowayz.onrender.com)
- `VITE_PAYSTACK_PUBLIC_KEY` - Paystack public key (test/live)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT authentication secret
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - Google OAuth
- `CLOUDINARY_*` - Image upload credentials
- `MAIL_USER` & `MAIL_PASS` - Gmail SMTP
- `PORT`, `NODE_ENV` - Backend configuration

**Tailwind Theme**: Custom colors (primary, secondary, accent, gray) with extended fonts, shadows, and animations

**TypeScript Paths**: `@/*` maps to `src/*`

## Deployment

**Frontend**: 
- Vercel (`vercel.json`) - SPA rewrites configured
- Netlify (`netlify.toml`) - SPA rewrites for client routing

**Backend**: 
- Render (via Node.js runtime)

## Testing & Validation

**Linting**:
- ESLint with TypeScript support (8.53.0)
- Strict mode enabled for React hooks and refresh
- Configuration: `eslint.config.js`

**Run Command**:
```bash
npm run lint         # Lint all TypeScript/TSX files
```

No unit/integration tests or test framework (Jest/Vitest) found in project configuration.
