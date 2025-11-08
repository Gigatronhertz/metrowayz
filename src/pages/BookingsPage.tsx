import React, { useState, useEffect } from 'react'
import { Calendar, RotateCcw } from 'lucide-react'
import { bookingAPI } from '../services/api'
import { BookingStatus } from '../types'
import { formatCurrency, formatDateRange } from '../utils/format'
import Header from '../components/layout/Header'
import BottomNavigation from '../components/layout/BottomNavigation'
import Card from '../components/ui/Card'
import CancelBookingModal from '../components/booking/CancelBookingModal'
import RescheduleBookingModal from '../components/booking/RescheduleBookingModal'

interface Booking {
  _id: string
  serviceId: { _id: string; price?: number; priceUnit?: string } | string
  serviceName: string
  serviceLocation: string
  serviceImages: string[]
  checkInDate: Date
  checkOutDate: Date
  guests: number
  totalAmount: number
  status: string
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="My Bookings" showNotifications />

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-padding">
          <div className="flex space-x-8">
            {[
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'past', label: 'Past' },
              { key: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 border-b-2 font-semibold transition-colors ${
                  activeTab === tab.key
                    ? 'border-secondary-500 text-secondary-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-padding py-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState type={activeTab} />
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking._id} className="p-4">
                <div className="flex space-x-4">
                  <img
                    src={booking.serviceImages[0] || '/placeholder.jpg'}
                    alt={booking.serviceName}
                    className="w-20 h-20 rounded-lg object-cover"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {booking.serviceName}
                      </h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status as any)}`}>
                        {getStatusText(booking.status as any)}
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-1">{booking.serviceLocation}</p>
                    <p className="text-gray-600 text-sm mb-2">
                      {formatDateRange(new Date(booking.checkInDate), new Date(booking.checkOutDate))}
                    </p>
                    <p className="text-gray-600 text-sm mb-3">
                      {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                    </p>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-lg text-primary-500">
                          {formatCurrency(booking.totalAmount)}
                        </span>
                        {typeof booking.serviceId === 'object' && booking.serviceId.price && booking.serviceId.priceUnit && (
                          <div className="text-xs text-gray-500">
                            {formatCurrency(booking.serviceId.price)} per {booking.serviceId.priceUnit}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* Show buttons for upcoming bookings (not completed or cancelled) */}
                        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                          <>
                            <button
                              onClick={() => handleRescheduleClick(booking)}
                              className="flex items-center space-x-1 px-3 py-1 bg-secondary-500 text-white text-sm rounded-lg hover:bg-secondary-600 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reschedule</span>
                            </button>
                            <button
                              onClick={() => handleCancelClick(booking)}
                              className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        <button className="px-3 py-1 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors">
                          View Details
                        </button>
                        {/* Debug: Show status */}
                        <span className="text-xs text-gray-500 self-center">({booking.status})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
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
              totalAmount: selectedBooking.totalAmount
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