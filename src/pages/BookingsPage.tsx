import React, { useState } from 'react'
import { Calendar } from 'lucide-react'
import { bookings } from '../data/mockData'
import { BookingStatus } from '../types'
import { formatCurrency, formatDateRange } from '../utils/format'
import Header from '../components/layout/Header'
import BottomNavigation from '../components/layout/BottomNavigation'
import Card from '../components/ui/Card'

const BookingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming')

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

  const filteredBookings = bookings.filter(booking => {
    const now = new Date()
    const checkIn = new Date(booking.checkIn)
    
    switch (activeTab) {
      case 'upcoming':
        return booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.PENDING
      case 'past':
        return booking.status === BookingStatus.COMPLETED || (checkIn < now && booking.status === BookingStatus.CONFIRMED)
      case 'cancelled':
        return booking.status === BookingStatus.CANCELLED
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
                    ? 'border-primary-500 text-primary-500'
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
        {filteredBookings.length === 0 ? (
          <EmptyState type={activeTab} />
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="p-4">
                <div className="flex space-x-4">
                  <img
                    src={booking.serviceImages[0]}
                    alt={booking.serviceName}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {booking.serviceName}
                      </h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-1">{booking.serviceLocation}</p>
                    <p className="text-gray-600 text-sm mb-2">
                      {formatDateRange(booking.checkIn, booking.checkOut)}
                    </p>
                    <p className="text-gray-600 text-sm mb-3">
                      {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg text-primary-500">
                        {formatCurrency(booking.totalAmount)}
                      </span>
                      
                      <div className="flex space-x-2">
                        {booking.status === BookingStatus.PENDING && (
                          <button className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors">
                            Cancel
                          </button>
                        )}
                        <button className="px-3 py-1 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors">
                          View Details
                        </button>
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
    </div>
  )
}

export default BookingsPage