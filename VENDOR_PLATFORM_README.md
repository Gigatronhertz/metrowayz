# 🚀 MetroWayz Vendor Platform - Complete Guide

## 📋 Overview

The MetroWayz Vendor Platform is a comprehensive multi-vendor service booking system that allows service providers to list their services, manage bookings, track earnings, and grow their business.

### Key Features Added:
- ✅ Complete Vendor Dashboard with analytics
- ✅ Service Management (Create, Edit, Delete services)
- ✅ Booking Management (Approve/Reject bookings)
- ✅ Calendar View for booking tracking
- ✅ Financial Dashboard with transaction history
- ✅ Profile Management
- ✅ Settings and Preferences
- ✅ Role-based routing (Customer vs Vendor)
- ✅ Become Vendor registration flow

---

## 🏗️ Project Structure

```
metrowayz/
├── backend/
│   └── middleware/
│       └── auth.js              # Authentication middleware
├── src/
│   ├── pages/
│   │   ├── vendor/              # Vendor Pages
│   │   │   ├── VendorDashboard.tsx
│   │   │   ├── VendorServices.tsx
│   │   │   ├── VendorServiceForm.tsx
│   │   │   ├── VendorBookings.tsx
│   │   │   ├── VendorCalendar.tsx
│   │   │   ├── VendorFinancial.tsx
│   │   │   ├── VendorProfile.tsx
│   │   │   ├── VendorSettings.tsx
│   │   │   └── VendorReviews.tsx
│   │   ├── RoleSelectionPage.tsx
│   │   └── BecomeVendorPage.tsx
│   ├── components/
│   │   └── vendor/              # Vendor Components
│   │       ├── VendorLayout.tsx
│   │       ├── VendorSidebar.tsx
│   │       └── VendorHeader.tsx
│   ├── services/
│   │   └── vendor/
│   │       └── vendorApi.ts     # Vendor API Service
│   └── App.tsx                  # Updated with vendor routes
├── model/                       # MongoDB Models
│   ├── User.js
│   ├── Service.js
│   ├── Booking.js
│   └── Review.js
└── server.js                    # Backend API (existing)
```

---

## 🎯 User Roles

### 1. Customer (userType: 'customer')
- Browse and search services
- Book services
- Leave reviews
- Manage bookings

### 2. Vendor/Provider (userType: 'provider')
- Create and manage services
- Accept/reject bookings
- Track earnings
- Manage business profile

### 3. Both (userType: 'both')
- Access to both customer and vendor portals
- Can switch between modes

---

## 🛤️ Routes

### Customer Routes
```
/ → Onboarding page
/home → Customer homepage
/search → Search services
/service/:id → Service details
/booking/:serviceId → Booking page
/bookings → Customer bookings
/profile → Customer profile
```

### Vendor Routes
```
/become-vendor → Register as vendor
/select-role → Choose customer or vendor mode
/vendor/dashboard → Vendor dashboard
/vendor/services → Manage services
/vendor/services/new → Create new service
/vendor/services/edit/:id → Edit service
/vendor/bookings → Manage bookings
/vendor/calendar → Calendar view
/vendor/financial → Financial dashboard
/vendor/reviews → Reviews management
/vendor/profile → Vendor profile
/vendor/settings → Settings
```

---

## 🔌 API Endpoints (Existing in server.js)

### Authentication
- `GET /auth/google` - Google OAuth login
- `GET /dashboard` - Get user details

### Vendor Dashboard
- `GET /dashboard-stats` - Get vendor statistics
- `GET /recent-bookings` - Get recent bookings
- `GET /dashboard-analytics` - Get analytics data

### Service Management
- `POST /create-service` - Create new service
- `GET /api/public/services` - Get services (with filters)
- `PUT /services/:id` - Update service
- `DELETE /services/:id` - Delete service
- `PUT /services/:id/status` - Update service status
- `GET /cloudinary-signature` - Get Cloudinary upload signature

### Booking Management
- `GET /api/provider/bookings` - Get provider's bookings
- `GET /api/provider/bookings/pending` - Get pending bookings
- `PUT /api/provider/bookings/:id/approve` - Approve booking
- `PUT /api/provider/bookings/:id/reject` - Reject booking
- `PUT /api/bookings/:id/status` - Update booking status
- `GET /api/provider/calendar` - Get calendar data

### Cancellation & Reschedule
- `GET /api/provider/cancellation-requests` - Get cancellation requests
- `GET /api/provider/reschedule-requests` - Get reschedule requests
- `PUT /api/provider/reschedule-requests/:id/approve` - Approve reschedule
- `PUT /api/provider/reschedule-requests/:id/reject` - Reject reschedule

### Financial
- `GET /financial/overview` - Financial overview
- `GET /financial/transactions` - Transaction history
- `GET /financial/payouts` - Payout information

### Profile
- `GET /user-details` - Get user details
- `POST /update-profile` - Update profile

---

## 💻 Setup Instructions

### Prerequisites
- Node.js 16+
- MongoDB
- Cloudinary account
- Google OAuth credentials

### Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# JWT
JWT_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=dhs1b7iqo
CLOUDINARY_API_KEY=141536624673227
CLOUDINARY_API_SECRET=rSWhlOU2Zv_SzXhMbDdIs8PxlMk

# Email
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# Server
PORT=5000

# Frontend
VITE_API_URL=http://localhost:5000
```

### Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Start Backend**
```bash
node server.js
```

3. **Start Frontend** (in a new terminal)
```bash
npm run dev
```

4. **Access Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## 👤 User Flows

### Becoming a Vendor

1. User signs in with Google (becomes customer by default)
2. Navigate to `/become-vendor`
3. Review vendor benefits and terms
4. Agree to terms and submit
5. Profile updated to vendor/provider
6. Redirected to `/vendor/dashboard`

### Managing Services (Vendor)

1. Go to `/vendor/services`
2. Click "Add New Service"
3. Fill in service details:
   - Title, category, description
   - Location, price, price unit
   - Upload images (direct to Cloudinary)
   - Select amenities
4. Submit to create service
5. Service appears in listings
6. Can edit, delete, or toggle status

### Managing Bookings (Vendor)

1. Customer creates booking → Status: "pending"
2. Vendor receives notification
3. Go to `/vendor/bookings`
4. View booking details
5. Approve or reject booking
6. If approved → Status: "confirmed"
7. After service delivery → Mark as "completed"

### Calendar View (Vendor)

1. Go to `/vendor/calendar`
2. See all bookings in calendar format
3. Navigate between months
4. Click dates to see booking details

---

## 🎨 UI Components

### Vendor Layout
- **VendorSidebar**: Navigation menu with links to all vendor pages
- **VendorHeader**: Top bar with search, notifications, and user profile
- **VendorLayout**: Wrapper component combining sidebar and header

### Key Features
- Responsive design (desktop and mobile)
- Tailwind CSS styling
- React Query for data fetching
- Toast notifications for user feedback
- Modal dialogs for detailed views

---

## 🔐 Authentication & Authorization

### JWT Token Flow
1. User logs in with Google
2. Backend generates JWT token
3. Token stored in localStorage
4. Token sent with every API request in Authorization header
5. Backend validates token with `authenticateJWT` middleware

### Role-Based Access
- `requireProvider` middleware checks if user is vendor
- Routes protected with `ProtectedRoute` component
- Automatic redirect based on userType

---

## 📊 Database Models

### User Model
```javascript
{
  googleId: String,
  name: String,
  email: String,
  profilePic: String,
  phoneNumber: String,
  userType: 'customer' | 'provider' | 'both',
  isAdmin: Boolean,
  businessName: String,
  businessDescription: String,
  businessType: String,
  categories: [String],
  // ... more fields
}
```

### Service Model
```javascript
{
  title: String,
  category: String,
  description: String,
  location: String,
  price: Number,
  priceUnit: String,
  images: [{url: String, publicId: String}],
  amenities: [String],
  status: 'active' | 'inactive' | 'pending',
  createdBy: ObjectId,
  rating: Number,
  reviewCount: Number,
  // ... more fields
}
```

### Booking Model
```javascript
{
  serviceId: ObjectId,
  userId: ObjectId,
  providerId: ObjectId,
  checkInDate: Date,
  checkOutDate: Date,
  guests: Number,
  totalAmount: Number,
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed',
  specialRequests: String,
  // ... more fields
}
```

---

## 🚀 Deployment

### Backend (Render.com)
1. Create Web Service
2. Connect GitHub repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables
6. Deploy

### Frontend (Vercel)
1. Import project
2. Framework: Vite
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variables
6. Deploy

---

## 🧪 Testing

### Manual Testing Checklist

**Vendor Registration:**
- [ ] User can navigate to /become-vendor
- [ ] Terms agreement checkbox works
- [ ] Profile updates to vendor type
- [ ] Redirects to vendor dashboard

**Service Management:**
- [ ] Can create new service
- [ ] Images upload to Cloudinary
- [ ] Can edit existing service
- [ ] Can delete service
- [ ] Can toggle active/inactive status

**Booking Management:**
- [ ] Pending bookings appear in dashboard
- [ ] Can approve bookings
- [ ] Can reject bookings
- [ ] Can mark bookings as completed
- [ ] Status changes reflect in customer view

**Financial Dashboard:**
- [ ] Stats display correctly
- [ ] Transactions list shows
- [ ] Earnings calculations accurate

**Calendar View:**
- [ ] Bookings appear on correct dates
- [ ] Can navigate between months
- [ ] Color coding works

---

## 📝 API Request Examples

### Create Service
```javascript
POST /create-service
Authorization: Bearer {token}

{
  "title": "Luxury 2-Bedroom Apartment",
  "category": "Accommodation",
  "description": "Beautiful apartment in the heart of Lagos",
  "location": "Lagos, Nigeria",
  "price": 50000,
  "priceUnit": "night",
  "images": [
    {
      "url": "https://res.cloudinary.com/...",
      "publicId": "metrowayz-services/abc123"
    }
  ],
  "amenities": ["WiFi", "Pool", "Parking"],
  "latitude": 6.5244,
  "longitude": 3.3792
}
```

### Approve Booking
```javascript
PUT /api/provider/bookings/{bookingId}/approve
Authorization: Bearer {token}

Response: {
  "success": true,
  "message": "Booking approved successfully",
  "booking": {...}
}
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Images not uploading**
- Check Cloudinary credentials in .env
- Verify signature generation endpoint
- Check browser console for errors

**2. Can't access vendor dashboard**
- Verify user userType is 'provider' or 'both'
- Check JWT token is valid
- Clear localStorage and re-login

**3. Bookings not showing**
- Check database has bookings with matching providerId
- Verify API endpoint returns data
- Check React Query cache

**4. Routes not working**
- Verify react-router-dom is installed
- Check App.tsx has all routes defined
- Clear browser cache

---

## 🔄 Future Enhancements

- [ ] Real-time notifications with Socket.io
- [ ] Advanced analytics with charts (Recharts)
- [ ] Bulk operations for services
- [ ] Export reports (PDF/CSV)
- [ ] In-app messaging between customer and vendor
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Mobile app (React Native)
- [ ] Vendor verification system
- [ ] Promotions and discounts management

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review the code comments
3. Test API endpoints with Postman
4. Check browser console for errors
5. Verify environment variables

---

## ✅ What's Working

✅ Vendor registration flow
✅ Service CRUD operations
✅ Booking management
✅ Calendar view
✅ Financial dashboard
✅ Profile management
✅ Role-based routing
✅ Image uploads to Cloudinary
✅ Authentication with JWT
✅ Google OAuth integration
✅ Responsive design
✅ Toast notifications

---

## 📄 License

This project is part of the MetroWayz platform.

---

**Built with ❤️ using React, TypeScript, Node.js, Express, and MongoDB**
