import { Service, User, Booking, BookingStatus, NotificationItem, NotificationType, Category } from '../types'

export const categories: Category[] = [
  { id: 'accommodation', name: 'Accommodation', icon: '🏠' },
  { id: 'transportation', name: 'Transportation', icon: '🚗' },
  { id: 'event-services', name: 'Event\nServices', icon: '🎉' },
  { id: 'cleaning', name: 'Cleaning', icon: '🧹' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎭' },
  { id: 'health-wellness', name: 'Health &\nWellness', icon: '💪' },
  { id: 'professional', name: 'Professional\nServices', icon: '💼' },
]

export const services: Service[] = [
  {
    id: '1',
    title: 'Luxury Apartment - Victoria Island',
    category: 'Short-let Rentals',
    description: 'Beautiful luxury apartment with stunning views of Lagos Island. Features modern amenities and prime location.',
    location: 'Victoria Island, Lagos',
    price: 25000,
    priceUnit: 'night',
    rating: 4.5,
    reviewCount: 24,
    images: [
      'https://images.pexels.com/photos/1428348/pexels-photo-1428348.jpeg',
      'https://images.pexels.com/photos/2251247/pexels-photo-2251247.jpeg',
      'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg',
    ],
    amenities: ['WiFi', 'Pool', 'Gym', 'Parking', 'Air Conditioning', 'Kitchen'],
    latitude: 6.4281,
    longitude: 3.4219,
    isAvailable: true,
  },
  {
    id: '2',
    title: 'Modern Studio - Lekki',
    category: 'Serviced Apartments',
    description: 'Cozy modern studio apartment perfect for business travelers and short stays.',
    location: 'Lekki Phase 1, Lagos',
    price: 18000,
    priceUnit: 'night',
    rating: 4.8,
    reviewCount: 15,
    images: [
      'https://images.pexels.com/photos/2029667/pexels-photo-2029667.jpeg',
      'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg',
    ],
    amenities: ['WiFi', 'Kitchen', 'Parking', 'Security', 'Generator'],
    latitude: 6.4698,
    longitude: 3.5852,
    isAvailable: true,
  },
  {
    id: '3',
    title: 'BMW X3 Rental',
    category: 'Car Rentals',
    description: 'Premium BMW X3 for your luxury transportation needs. Well maintained with comprehensive insurance.',
    location: 'Ikeja, Lagos',
    price: 22000,
    priceUnit: 'day',
    rating: 4.6,
    reviewCount: 32,
    images: [
      'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg',
      'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg',
    ],
    amenities: ['GPS', 'Insurance', 'Fuel Efficient', 'Automatic', 'Bluetooth'],
    latitude: 6.6018,
    longitude: 3.3515,
    isAvailable: true,
  },
]

export const currentUser: User = {
  id: '1',
  name: 'Sarah Johnson',
  email: 'sarah@example.com',
  rating: 4.8,
  totalBookings: 12,
  loyaltyPoints: 1250,
  membershipTier: 'Gold',
  referrals: 3,
}

export const bookings: Booking[] = [
  {
    id: '1',
    serviceId: '1',
    serviceName: 'Luxury Apartment',
    serviceLocation: 'Victoria Island',
    serviceImages: ['https://images.pexels.com/photos/1428348/pexels-photo-1428348.jpeg'],
    checkIn: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    checkOut: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    guests: 2,
    totalAmount: 52500,
    status: BookingStatus.CONFIRMED,
  },
  {
    id: '2',
    serviceId: '3',
    serviceName: 'BMW X3 Rental',
    serviceLocation: 'Lekki Phase 1',
    serviceImages: ['https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg'],
    checkIn: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    checkOut: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    guests: 1,
    totalAmount: 45000,
    status: BookingStatus.PENDING,
  },
]

export const notifications: NotificationItem[] = [
  {
    id: '1',
    type: NotificationType.BOOKING,
    title: 'Booking Confirmed',
    message: 'Your booking for Luxury Apartment has been confirmed',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: false,
  },
  {
    id: '2',
    type: NotificationType.PAYMENT,
    title: 'Payment Reminder',
    message: 'Complete payment for your upcoming BMW X3 rental',
    time: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isRead: false,
  },
  {
    id: '3',
    type: NotificationType.LOYALTY,
    title: 'New Loyalty Points',
    message: 'You earned 250 points from your recent booking',
    time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    isRead: true,
  },
]

export const banners = [
  {
    title: '🏠 Weekend Getaways',
    subtitle: '20% off luxury apartments this weekend',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=400&fit=crop',
  },
  {
    title: '🚗 Premium Car Deals',
    subtitle: 'Luxury cars starting from ₦15,000/day',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=400&fit=crop',
  },
]