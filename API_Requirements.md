# API Requirements Document
## Metrowayz Admin Dashboard Backend

**Project:** Metrowayz Admin Dashboard
**Frontend Base URL:** `https://metrowayz.onrender.com`
**Technology Stack:** React.js with Axios, React Query, JWT Authentication
**Date:** 2025-09-26

---

## 1. API Configuration & Infrastructure

### Base Requirements
- **Authentication:** JWT token-based with Bearer token in headers
- **Content-Type:** `application/json` for all endpoints
- **CORS:** Enable for frontend domain
- **Rate Limiting:** Implement to prevent abuse
- **Error Handling:** Consistent error response format

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"],
  "code": "ERROR_CODE"
}
```

### Success Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Success message"
}
```

---

## 2. Authentication & User Management

### 2.1 User Login
**Endpoint:** `POST /auth/login`
**Description:** Authenticate user with email and password

**Request Body:**
```json
{
  "email": "admin@Metrowayz.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token-string",
    "user": {
      "id": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "businessName": "Luxury Stays Lagos",
      "businessType": "accommodation",
      "avatar": "https://example.com/avatar.jpg",
      "role": "owner",
      "verified": true,
      "permissions": ["manage_services", "view_analytics"]
    }
  }
}
```

### 2.2 User Registration
**Endpoint:** `POST /auth/register`
**Description:** Register new business owner

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "businessName": "My Business",
  "businessType": "accommodation",
  "phone": "+234-800-123-4567"
}
```

### 2.3 Google OAuth Login
**Endpoint:** `POST /auth/google`
**Description:** Authenticate using Google OAuth token

**Request Body:**
```json
{
  "token": "google-oauth-token"
}
```

### 2.4 Token Validation
**Endpoint:** `GET /dashboard`
**Headers:** `Authorization: Bearer {token}`
**Description:** Validate token and return user data

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "businessName": "Luxury Stays Lagos",
    "role": "owner",
    "permissions": ["manage_services", "view_analytics"]
  }
}
```

### 2.5 Token Refresh
**Endpoint:** `POST /auth/refresh`
**Headers:** `Authorization: Bearer {refresh-token}`

---

## 3. Dashboard & Analytics

### 3.1 Dashboard Statistics
**Endpoint:** `GET /dashboard/stats`
**Headers:** `Authorization: Bearer {token}`
**Description:** Get key business metrics

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBookings": 156,
    "totalRevenue": 2450000,
    "activeServices": 12,
    "averageRating": 4.8,
    "monthlyGrowth": 15.3,
    "conversionRate": 12.5
  }
}
```

### 3.2 Recent Bookings
**Endpoint:** `GET /dashboard/recent-bookings`
**Headers:** `Authorization: Bearer {token}`
**Query Parameters:** `?limit=10`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "booking-id",
      "customerName": "Sarah Johnson",
      "serviceName": "Luxury Apartment - Victoria Island",
      "checkIn": "2024-01-15",
      "checkOut": "2024-01-17",
      "amount": 52500,
      "status": "confirmed",
      "avatar": "https://example.com/avatar.jpg"
    }
  ]
}
```

### 3.3 Analytics Data
**Endpoint:** `GET /dashboard/analytics`
**Headers:** `Authorization: Bearer {token}`
**Query Parameters:** `?period=6m` (1m, 3m, 6m, 1y)

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": [
      { "month": "Jan", "amount": 180000 },
      { "month": "Feb", "amount": 220000 }
    ],
    "bookings": [
      { "month": "Jan", "count": 12 },
      { "month": "Feb", "count": 18 }
    ]
  }
}
```

---

## 4. Service Management

### 4.1 Get Services
**Endpoint:** `GET /services`
**Headers:** `Authorization: Bearer {token}`
**Query Parameters:**
- `?category=accommodation`
- `?status=active`
- `?search=luxury`
- `?page=1&limit=10`

**Response:**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "service-id",
        "title": "Luxury Apartment - Victoria Island",
        "category": "accommodation",
        "price": 25000,
        "priceUnit": "night",
        "status": "active",
        "bookings": 24,
        "rating": 4.5,
        "images": ["https://example.com/image1.jpg"],
        "description": "Beautiful luxury apartment with stunning views",
        "amenities": ["WiFi", "Pool", "Gym", "Parking"],
        "location": "Victoria Island, Lagos",
        "capacity": 4,
        "duration": "24 hours"
      }
    ],
    "pagination": {
      "current": 1,
      "total": 5,
      "perPage": 10,
      "totalItems": 50
    }
  }
}
```

### 4.2 Create Service
**Endpoint:** `POST /services`
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "title": "Luxury Apartment - Victoria Island",
  "description": "Beautiful luxury apartment",
  "category": "accommodation",
  "price": 25000,
  "priceUnit": "night",
  "capacity": 4,
  "duration": "24 hours",
  "amenities": ["WiFi", "Pool", "Gym"],
  "location": "Victoria Island, Lagos",
  "images": ["image-url-1", "image-url-2"]
}
```

### 4.3 Update Service
**Endpoint:** `PUT /services/{id}`
**Headers:** `Authorization: Bearer {token}`

### 4.4 Delete Service
**Endpoint:** `DELETE /services/{id}`
**Headers:** `Authorization: Bearer {token}`

### 4.5 Upload Service Images
**Endpoint:** `POST /services/images/upload`
**Headers:** `Authorization: Bearer {token}`, `Content-Type: multipart/form-data`

**Request Body:**
```
files: [File objects]
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "img-id",
      "url": "https://cloudinary.com/image.jpg",
      "name": "image.jpg",
      "size": 245760
    }
  ]
}
```

---

## 5. Booking Management

### 5.1 Get Bookings
**Endpoint:** `GET /bookings`
**Headers:** `Authorization: Bearer {token}`
**Query Parameters:**
- `?status=pending,confirmed,completed`
- `?dateFrom=2024-01-01&dateTo=2024-12-31`
- `?customer=customer-name`
- `?service=service-id`
- `?page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "booking-id",
        "customerName": "Sarah Johnson",
        "customerEmail": "sarah@example.com",
        "customerPhone": "+234-800-123-4567",
        "serviceName": "Luxury Apartment",
        "serviceCategory": "accommodation",
        "bookingDate": "2024-01-15",
        "checkIn": "2024-01-15T14:00:00Z",
        "checkOut": "2024-01-17T11:00:00Z",
        "guests": 2,
        "totalAmount": 52500,
        "status": "confirmed",
        "paymentStatus": "paid",
        "notes": "Special requirements noted",
        "location": "Victoria Island, Lagos"
      }
    ],
    "pagination": { "current": 1, "total": 10 }
  }
}
```

### 5.2 Get Booking Details
**Endpoint:** `GET /bookings/{id}`
**Headers:** `Authorization: Bearer {token}`

### 5.3 Update Booking Status
**Endpoint:** `PUT /bookings/{id}/status`
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "status": "confirmed",
  "notes": "Booking confirmed with customer"
}
```

### 5.4 Export Bookings
**Endpoint:** `GET /bookings/export`
**Headers:** `Authorization: Bearer {token}`
**Query Parameters:** `?format=csv&dateFrom=2024-01-01&dateTo=2024-12-31`

---

## 6. Customer Management

### 6.1 Get Customers
**Endpoint:** `GET /customers`
**Headers:** `Authorization: Bearer {token}`
**Query Parameters:**
- `?search=customer-name`
- `?status=active,vip,inactive`
- `?sortBy=totalSpent,lastBooking`
- `?page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "customer-id",
        "name": "Sarah Johnson",
        "email": "sarah@example.com",
        "phone": "+234-800-123-4567",
        "location": "Lagos, Nigeria",
        "totalBookings": 5,
        "totalSpent": 150000,
        "averageRating": 4.8,
        "status": "vip",
        "joinDate": "2023-06-15T00:00:00Z",
        "lastBooking": "2024-01-15T00:00:00Z",
        "preferredServices": ["accommodation", "dining"]
      }
    ],
    "pagination": { "current": 1, "total": 8 }
  }
}
```

### 6.2 Get Customer Profile
**Endpoint:** `GET /customers/{id}`
**Headers:** `Authorization: Bearer {token}`

### 6.3 Get Customer Bookings
**Endpoint:** `GET /customers/{id}/bookings`
**Headers:** `Authorization: Bearer {token}`

### 6.4 Update Customer Information
**Endpoint:** `PUT /customers/{id}`
**Headers:** `Authorization: Bearer {token}`

---

## 7. Financial Management

### 7.1 Financial Overview
**Endpoint:** `GET /financial/overview`
**Headers:** `Authorization: Bearer {token}`
**Query Parameters:** `?period=6m`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEarnings": 2450000,
    "pendingPayouts": 125000,
    "thisMonth": 420000,
    "lastMonth": 380000,
    "platformFees": 75000,
    "netEarnings": 2375000
  }
}
```

### 7.2 Transaction History
**Endpoint:** `GET /financial/transactions`
**Headers:** `Authorization: Bearer {token}`
**Query Parameters:**
- `?type=booking,payout,fee`
- `?status=completed,pending`
- `?dateFrom=2024-01-01&dateTo=2024-12-31`
- `?page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn-id",
        "type": "booking",
        "amount": 52500,
        "fee": 2625,
        "netAmount": 49875,
        "date": "2024-01-15T10:30:00Z",
        "description": "Payment for Luxury Apartment booking",
        "status": "completed",
        "bookingId": "booking-id"
      }
    ],
    "pagination": { "current": 1, "total": 15 }
  }
}
```

### 7.3 Payout History
**Endpoint:** `GET /financial/payouts`
**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "payout-id",
      "amount": 380000,
      "date": "2024-01-01T00:00:00Z",
      "status": "completed",
      "method": "Bank Transfer",
      "bankAccount": "****1234",
      "reference": "PAY-2024-001"
    }
  ]
}
```

---

## 8. Business Profile Management

### 8.1 Get Business Profile
**Endpoint:** `GET /business/profile`
**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "business-id",
    "name": "Luxury Stays Lagos",
    "businessType": "accommodation",
    "description": "Premium accommodation provider in Lagos",
    "owner": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+234-801-234-5678"
    },
    "businessHours": {
      "monday": { "open": "09:00", "close": "18:00", "closed": false },
      "tuesday": { "open": "09:00", "close": "18:00", "closed": false },
      "wednesday": { "open": "09:00", "close": "18:00", "closed": false },
      "thursday": { "open": "09:00", "close": "18:00", "closed": false },
      "friday": { "open": "09:00", "close": "18:00", "closed": false },
      "saturday": { "open": "10:00", "close": "16:00", "closed": false },
      "sunday": { "open": "10:00", "close": "16:00", "closed": true }
    },
    "address": {
      "street": "123 Victoria Island",
      "city": "Lagos",
      "state": "Lagos State",
      "country": "Nigeria",
      "postalCode": "101001"
    },
    "socialMedia": {
      "facebook": "https://facebook.com/luxurystayslagos",
      "instagram": "https://instagram.com/luxurystayslagos",
      "twitter": "https://twitter.com/luxurystayslagos"
    },
    "website": "https://luxurystayslagos.com",
    "verified": true,
    "rating": 4.8,
    "totalServices": 12
  }
}
```

### 8.2 Update Business Profile
**Endpoint:** `PUT /business/profile`
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "name": "Updated Business Name",
  "description": "Updated description",
  "businessHours": { "monday": { "open": "09:00", "close": "18:00", "closed": false } },
  "address": {
    "street": "123 Victoria Island",
    "city": "Lagos",
    "state": "Lagos State",
    "country": "Nigeria",
    "postalCode": "101001"
  },
  "socialMedia": {
    "facebook": "https://facebook.com/business",
    "instagram": "https://instagram.com/business"
  },
  "website": "https://business.com"
}
```

---

## 9. File Upload & Media Management

### 9.1 Upload Files
**Endpoint:** `POST /upload/images`
**Headers:** `Authorization: Bearer {token}`, `Content-Type: multipart/form-data`

**Request Body:**
```
files: [File objects]
type: "service" | "profile" | "document"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "file-id",
      "url": "https://storage.example.com/file.jpg",
      "name": "original-name.jpg",
      "size": 245760,
      "type": "image/jpeg",
      "uploadedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 9.2 Delete File
**Endpoint:** `DELETE /upload/{fileId}`
**Headers:** `Authorization: Bearer {token}`

---

## 10. Settings & Configuration

### 10.1 Get User Settings
**Endpoint:** `GET /settings/user`
**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": {
      "email": true,
      "sms": false,
      "push": true,
      "newBookings": true,
      "cancellations": true,
      "payments": true
    },
    "preferences": {
      "language": "en",
      "timezone": "Africa/Lagos",
      "currency": "NGN",
      "dateFormat": "DD/MM/YYYY"
    }
  }
}
```

### 10.2 Update User Settings
**Endpoint:** `PUT /settings/user`
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "notifications": {
    "email": true,
    "sms": false,
    "newBookings": true
  },
  "preferences": {
    "language": "en",
    "timezone": "Africa/Lagos"
  }
}
```

---

## 11. Additional Requirements

### 11.1 Security Headers
All endpoints should include:
- `Authorization: Bearer {token}` for protected routes
- CORS headers for frontend domain
- Rate limiting headers
- Content Security Policy headers

### 11.2 Pagination Format
For all list endpoints, include pagination:
```json
{
  "pagination": {
    "current": 1,
    "total": 10,
    "perPage": 20,
    "totalItems": 200,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 11.3 Search & Filtering
Support query parameters for:
- Full-text search: `?search=term`
- Status filtering: `?status=active,inactive`
- Date ranges: `?dateFrom=2024-01-01&dateTo=2024-12-31`
- Sorting: `?sortBy=name&sortOrder=asc`

### 11.4 Real-time Features (Optional)
Consider WebSocket endpoints for:
- Live booking notifications
- Real-time dashboard updates
- Customer message notifications

### 11.5 Data Export
Support CSV/PDF export for:
- Booking reports
- Financial statements
- Customer lists
- Analytics data

---

## 12. Testing Endpoints

For development and testing, ensure all endpoints support:
- Authentication testing with valid/invalid tokens
- Input validation with proper error messages
- Edge cases for missing or malformed data
- Performance testing with large datasets

**Contact:** Frontend expects API to be available at `https://metrowayz.onrender.com`

---

*This document covers all API requirements identified from the Metrowayz Admin Dashboard frontend codebase. Implement these endpoints to enable full functionality of the admin dashboard.*