import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { bookingAPI } from '../services/api'
import { formatCurrency } from '../utils/format'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const PaymentPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('free')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [bookingData, setBookingData] = useState<any>(null)

  // Load booking data from localStorage
  useEffect(() => {
    const pendingBooking = localStorage.getItem('pendingBooking')
    if (pendingBooking) {
      setBookingData(JSON.parse(pendingBooking))
    } else {
      // No booking data, redirect back
      navigate('/search')
    }
  }, [navigate])

  const paymentMethods = [
    {
      id: 'free',
      name: 'Free Booking (No Payment Required)',
      description: 'Book now, pay later',
      icon: Check,
    },
  ]

  const handlePayment = async () => {
    if (!bookingData) return

    setIsProcessing(true)

    try {
      // First, check if dates are still available
      const availabilityCheck = await bookingAPI.checkAvailability(
        bookingData.serviceId,
        bookingData.checkInDate,
        bookingData.checkOutDate
      )

      console.log('=== FRONTEND AVAILABILITY CHECK ===')
      console.log('Full response:', availabilityCheck)
      console.log('availabilityCheck.data:', availabilityCheck.data)
      console.log('availabilityCheck.success:', availabilityCheck.success)
      console.log('===================================')

      if (!availabilityCheck.data) {
        console.error('BLOCKING: Dates are not available!')
        alert('Sorry, these dates are no longer available. Please go back and select different dates.')
        setIsProcessing(false)
        return
      }

      console.log('✅ Availability check passed! Proceeding with booking...')

      // Dates are available, proceed with creating booking
      await bookingAPI.createBooking({
        serviceId: bookingData.serviceId,
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        guests: bookingData.guests || 1,
        specialRequests: bookingData.specialRequests || ''
      })

      // Clear pending booking data
      localStorage.removeItem('pendingBooking')

      setShowSuccess(true)
    } catch (error) {
      console.error('Error creating booking:', error)
      alert('Failed to create booking. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSuccessClose = () => {
    setShowSuccess(false)
    navigate('/bookings')
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your booking has been confirmed. You will receive a confirmation email shortly.
          </p>
          
          <Button onClick={handleSuccessClose} className="w-full">
            View My Bookings
          </Button>
        </Card>
      </div>
    )
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  const duration = Math.ceil(
    (new Date(bookingData.checkOutDate).getTime() - new Date(bookingData.checkInDate).getTime()) /
    (1000 * 60 * 60 * 24)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Confirm Booking" showBack />

      <div className="container-padding py-6 space-y-6">
        {/* Payment Summary */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h2>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Service:</span>
              <span className="font-semibold">{bookingData.serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-semibold">{duration} {bookingData.servicePriceUnit}(s)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Guests:</span>
              <span className="font-semibold">{bookingData.guests}</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="text-lg font-bold">Total Amount:</span>
              <span className="text-lg font-bold text-primary-500">
                {formatCurrency(bookingData.totalAmount)}
              </span>
            </div>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
          
          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon
              const isSelected = selectedPaymentMethod === method.id
              
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-colors text-left ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                    }`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    
                    <Icon className="w-6 h-6 text-gray-600" />
                    
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{method.name}</div>
                      <div className="text-sm text-gray-600">{method.description}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Info Card */}
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800 mb-2">Free Booking</h3>
              <p className="text-green-700 text-sm leading-relaxed">
                This is a free booking! No payment required. You can cancel anytime before check-in.
              </p>
            </div>
          </div>
        </Card>

        {/* Confirm Button */}
        <div className="pb-6">
          <Button
            onClick={handlePayment}
            isLoading={isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Confirming Booking...' : 'Confirm Booking (Free)'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage