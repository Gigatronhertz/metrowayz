import React, { useState } from 'react'
import { X, Calendar, Info, AlertCircle, Check } from 'lucide-react'
import { bookingAPI } from '../../services/api'
import Button from '../ui/Button'
import BookingCalendar from '../Calendar/BookingCalendar'

interface RescheduleBookingModalProps {
  isOpen: boolean
  onClose: () => void
  bookingId: string
  serviceId: string
  bookingDetails: {
    serviceName: string
    checkInDate: Date
    checkOutDate: Date
    totalAmount: number
  }
  onSuccess: () => void
}

const RescheduleBookingModal: React.FC<RescheduleBookingModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  serviceId,
  bookingDetails,
  onSuccess
}) => {
  const [checkInDate, setCheckInDate] = useState<Date | null>(null)
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState<any>(null)
  const [loadingQuote, setLoadingQuote] = useState(false)

  const handleDateSelect = async (start: Date, end: Date | null) => {
    setCheckInDate(start)
    setCheckOutDate(end)

    // If both dates are selected, get quote
    if (end) {
      try {
        setLoadingQuote(true)
        const response = await bookingAPI.getRescheduleQuote(
          bookingId,
          start.toISOString(),
          end.toISOString()
        )
        setQuote(response.data)
      } catch (error) {
        console.error('Error getting quote:', error)
      } finally {
        setLoadingQuote(false)
      }
    } else {
      setQuote(null)
    }
  }

  const handleReschedule = async () => {
    if (!checkInDate || !checkOutDate) {
      alert('Please select both check-in and check-out dates')
      return
    }

    try {
      setLoading(true)
      await bookingAPI.rescheduleBooking(bookingId, {
        newCheckInDate: checkInDate.toISOString(),
        newCheckOutDate: checkOutDate.toISOString(),
        message
      })
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error rescheduling booking:', error)
      alert(error.message || 'Failed to submit reschedule request')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Reschedule Booking</h2>
            <p className="text-sm text-gray-600 mt-1">{bookingDetails.serviceName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info */}
          <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-sm">
              <h3 className="font-semibold text-blue-900 mb-1">How rescheduling works</h3>
              <ul className="text-blue-800 space-y-1 list-disc list-inside">
                <li>Select new dates from the calendar below</li>
                <li>Your request will be sent to the service provider</li>
                <li>You'll be notified once it's approved or rejected</li>
                <li>Price differences will be calculated automatically</li>
              </ul>
            </div>
          </div>

          {/* Current Dates */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Current Booking</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1">Check-in</p>
                <p className="font-medium text-gray-900">
                  {new Date(bookingDetails.checkInDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Check-out</p>
                <p className="font-medium text-gray-900">
                  {new Date(bookingDetails.checkOutDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select New Dates
            </label>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <BookingCalendar
                serviceId={serviceId}
                selectedCheckIn={checkInDate}
                selectedCheckOut={checkOutDate}
                onDateSelect={handleDateSelect}
              />
            </div>
          </div>

          {/* New Dates Display */}
          {checkInDate && checkOutDate && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Check className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">New Dates Selected</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-700 mb-1">New Check-in</p>
                  <p className="font-medium text-green-900">
                    {checkInDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-green-700 mb-1">New Check-out</p>
                  <p className="font-medium text-green-900">
                    {checkOutDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quote */}
          {loadingQuote && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Calculating new price...</p>
            </div>
          )}

          {quote && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-purple-900">Price Summary</h3>

              {quote.isAvailable ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-purple-800">
                    <span>Original Total:</span>
                    <span>₦{quote.pricing?.originalTotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-purple-800">
                    <span>New Total:</span>
                    <span>₦{quote.pricing?.newTotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-purple-200">
                    <span className="text-purple-900">Price Difference:</span>
                    <span className={quote.pricing?.difference > 0 ? 'text-orange-600' : 'text-green-600'}>
                      {quote.pricing?.difference >= 0 ? '+' : ''}₦{quote.pricing?.difference?.toLocaleString()}
                    </span>
                  </div>
                  {quote.pricing?.difference > 0 && (
                    <p className="text-xs text-purple-700 pt-2">
                      You'll need to pay the difference before check-in
                    </p>
                  )}
                  {quote.pricing?.difference < 0 && (
                    <p className="text-xs text-purple-700 pt-2">
                      The difference will be refunded to you
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800">
                    These dates are not available. Please select different dates.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Message to Provider (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Let the provider know why you're rescheduling..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleReschedule}
            isLoading={loading}
            disabled={loading || !checkInDate || !checkOutDate || !quote?.isAvailable}
          >
            Submit Reschedule Request
          </Button>
        </div>
      </div>
    </div>
  )
}

export default RescheduleBookingModal
