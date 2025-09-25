export interface Service {
  id: string
  title: string
  category: string
  description: string
  location: string
  price: number
  priceUnit: string
  rating: number
  reviewCount: number
  images: string[]
  amenities: string[]
  latitude: number
  longitude: number
  isAvailable: boolean
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  rating: number
  totalBookings: number
  loyaltyPoints: number
  membershipTier: string
  referrals: number
}

export interface Booking {
  id: string
  serviceId: string
  serviceName: string
  serviceLocation: string
  serviceImages: string[]
  checkIn: Date
  checkOut: Date
  guests: number
  totalAmount: number
  status: BookingStatus
  specialRequests?: string
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  time: Date
  isRead: boolean
}

export enum NotificationType {
  BOOKING = 'booking',
  PAYMENT = 'payment',
  LOYALTY = 'loyalty',
  OFFER = 'offer',
  REVIEW = 'review'
}

export interface Category {
  id: string
  name: string
  icon: string
  description?: string
}

export interface SearchFilters {
  category?: string
  location?: string
  priceRange?: [number, number]
  rating?: number
  amenities?: string[]
  sortBy?: 'price' | 'rating' | 'distance' | 'newest'
}