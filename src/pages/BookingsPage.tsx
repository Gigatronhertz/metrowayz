import React, { useState, useEffect } from 'react'
import { Calendar, RotateCcw } from 'lucide-react'
import { bookingAPI } from '../services/api'
import { BookingStatus } from '../types'
import { formatCurrency, formatDateRange, formatPriceUnit } from '../utils/format'
import Header from '../components/layout/Header'
import BottomNavigation from '../components/layout/BottomNavigation'
import CancelBookingModal from '../components/booking/CancelBookingModal'
import RescheduleBookingModal from '../components/booking/RescheduleBookingModal'

interface Booking {
  _id: string
  serviceId: { _id: string; price?: number; priceUnit?: string; category?: string; isChefService?: boolean } | string
  serviceName: string
  serviceLocation: string
  serviceImages: string[]
  checkInDate: Date
  checkOutDate: Date
  guests: number
  totalAmount: number
  status: string
  serviceCategory?: string
}

const BookingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  // Fetch user bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        const response = await bookingAPI.getUserBookings({ limit: 50 })
        setBookings(response.data || [])
      } catch (error) {
        console.error('Error fetching bookings:', error)
        setBookings([])
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [])

  const getStatusText = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED:
        return 'Confirmed'
      case BookingStatus.PENDING:
        return 'Pending'
      case BookingStatus.CANCELLED:
        return 'Cancelled'
      case BookingStatus.COMPLETED:
        return 'Completed'
    }
  }

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED:
        return 'bg-green-100 text-green-800'
      case BookingStatus.PENDING:
        return 'bg-amber-100 text-amber-800'
      case BookingStatus.CANCELLED:
        return 'bg-red-100 text-red-800'
      case BookingStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const handleCancelClick = (booking: Booking) => {
    setSelectedBooking(booking)
    setCancelModalOpen(true)
  }

  const handleRescheduleClick = (booking: Booking) => {
    setSelectedBooking(booking)
    setRescheduleModalOpen(true)
  }

  const handleRefreshBookings = async () => {
    try {
      const response = await bookingAPI.getUserBookings({ limit: 50 })
      setBookings(response.data || [])
    } catch (error) {
      console.error('Error refreshing bookings:', error)
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const now = new Date()
    const checkIn = new Date(booking.checkInDate)

    switch (activeTab) {
      case 'upcoming':
        return booking.status === 'confirmed' || booking.status === 'pending'
      case 'past':
        return booking.status === 'completed' || (checkIn < now && booking.status === 'confirmed')
      case 'cancelled':
        return booking.status === 'cancelled'
      default:
        return true
    }
  })

  const EmptyState = ({ type }: { type: string }) => (
    <div className="text-center py-12">
      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No {type} bookings
      </h3>
      <p className="text-gray-600">
        {type === 'upcoming' && 'Book your next amazing experience'}
        {type === 'past' && 'Your completed bookings will appear here'}
        {type === 'cancelled' && 'Your cancelled bookings will appear here'}
      </p>
    </div>
  )

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-0 relative">
      <Header title="My Bookings" showNotifications />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-50 to-secondary-50 py-8 lg:py-12">
        <div className="container-max">
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-2">
            My Bookings
          </h1>
          <p className="text-base lg:text-lg text-gray-600">
            Manage your service reservations and appointments
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container-max">
          <div className="flex space-x-8 overflow-x-auto scrollbar-hide">
            {[
              { key: 'upcoming', label: 'Upcoming', count: bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length },
              { key: 'past', label: 'Past', count: bookings.filter(b => b.status === 'completed').length },
              { key: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-2 border-b-2 font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === tab.key ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-max py-8 lg:py-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState type={activeTab} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden border border-gray-100"
              >
                {/* Image Section */}
                <div className="relative h-48 lg:h-56 overflow-hidden">
                  <img
                    src={booking.serviceImages[0] || '/placeholder.jpg'}
                    alt={booking.serviceName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                  {/* Status Badge */}
                  <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg ${getStatusColor(booking.status as any)}`}>
                    {getStatusText(booking.status as any)}
                  </div>

                  {/* Price Overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-white">
                      <div className="text-2xl font-display font-bold">
                        {formatCurrency(booking.totalAmount)}
                      </div>
                      {typeof booking.serviceId === 'object' && booking.serviceId.price && (
                        <div className="text-sm opacity-90">
                          {formatCurrency(booking.serviceId.price)} {booking.serviceId.isChefService ? 'per service' : formatPriceUnit(booking.serviceId.priceUnit || '', 'long')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase">Booking ID: {booking._id.slice(-8).toUpperCase()}</p>
                  </div>
                  
                  <h3 className="text-xl font-display font-bold text-gray-900 mb-3 line-clamp-2">
                    {booking.serviceName}
                  </h3>

                  <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                        {booking.serviceCategory || (typeof booking.serviceId === 'object' ? booking.serviceId.category : 'Service')}
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                      <span>{formatDateRange(new Date(booking.checkInDate), new Date(booking.checkOutDate))}</span>
                    </div>

                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-4 h-4 flex items-center justify-center text-gray-400">📍</span>
                      {booking.serviceLocation}
                    </p>

                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-4 h-4 flex items-center justify-center text-gray-400">👥</span>
                      {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                      <>
                        {/* Show reschedule for all services except private chef */}
                        {(booking.serviceCategory?.toLowerCase() !== 'private chef' && 
                          (typeof booking.serviceId === 'object' ? booking.serviceId.category?.toLowerCase() !== 'private chef' : true)) && (
                          <button
                            onClick={() => handleRescheduleClick(booking)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary-50 text-secondary-600 font-semibold rounded-xl hover:bg-secondary-100 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Reschedule</span>
                          </button>
                        )}
                        {/* Show cancel button for all services except private chef */}
                        {(booking.serviceCategory?.toLowerCase() !== 'private chef' && 
                          (typeof booking.serviceId === 'object' ? booking.serviceId.category?.toLowerCase() !== 'private chef' : true)) && (
                          <button
                            onClick={() => handleCancelClick(booking)}
                            className="flex-1 px-4 py-2.5 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </>
                    )}
                    <button className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />

      {/* Modals */}
      {selectedBooking && (
        <>
          <CancelBookingModal
            isOpen={cancelModalOpen}
            onClose={() => {
              setCancelModalOpen(false)
              setSelectedBooking(null)
            }}
            bookingId={selectedBooking._id}
            bookingDetails={{
              serviceName: selectedBooking.serviceName,
              checkInDate: selectedBooking.checkInDate,
              totalAmount: selectedBooking.totalAmount,
              serviceCategory: selectedBooking.serviceCategory || (typeof selectedBooking.serviceId === 'object' ? selectedBooking.serviceId.category : undefined)
            }}
            onSuccess={handleRefreshBookings}
          />

          <RescheduleBookingModal
            isOpen={rescheduleModalOpen}
            onClose={() => {
              setRescheduleModalOpen(false)
              setSelectedBooking(null)
            }}
            bookingId={selectedBooking._id}
            serviceId={typeof selectedBooking.serviceId === 'string' ? selectedBooking.serviceId : selectedBooking.serviceId._id}
            bookingDetails={{
              serviceName: selectedBooking.serviceName,
              checkInDate: selectedBooking.checkInDate,
              checkOutDate: selectedBooking.checkOutDate,
              totalAmount: selectedBooking.totalAmount
            }}
            onSuccess={handleRefreshBookings}
          />
        </>
      )}
    </div>
  )
}

export default BookingsPage