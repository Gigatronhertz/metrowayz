import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, CreditCard } from 'lucide-react'
import { usePaystackPayment } from 'react-paystack'
import { bookingAPI } from '../services/api'
import { formatCurrency } from '../utils/format'
import { useAuth } from '../context/AuthContext'
import { isPaystackConfigured, getPaystackPublicKey } from '../config/paystack'
import { convertToKobo, generatePaymentReference } from '../services/paystack'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const PaymentPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('paystack')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [bookingData, setBookingData] = useState<any>(null)
  const [paymentReference, setPaymentReference] = useState<string>('')

  // Check if Paystack is configured
  const paystackConfigured = isPaystackConfigured()



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

  // Create booking after payment
  const createBookingAfterPayment = async (reference: string) => {
    if (!bookingData) {
      console.error('❌ No booking data available')
      return
    }

    setIsProcessing(true)

    try {
      // First, check if dates are still available
      const availabilityCheck = await bookingAPI.checkAvailability(
        bookingData.serviceId,
        bookingData.checkInDate,
        bookingData.checkOutDate
      )

      if (!availabilityCheck.data) {
        console.error('❌ Dates not available')
        alert('Sorry, these dates are no longer available. Your payment will be refunded.')
        setIsProcessing(false)
        return
      }

      // Create booking with payment reference
      const bookingResponse = await bookingAPI.createBooking({
        serviceId: bookingData.serviceId,
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        guests: bookingData.guests || 1,
        specialRequests: bookingData.specialRequests || '',
      })

      // Clear pending booking data
      localStorage.removeItem('pendingBooking')

      setShowSuccess(true)
    } catch (error) {
      console.error('❌ Error creating booking:', error)
      alert('Failed to create booking. Please contact support with reference: ' + reference)
    } finally {
      setIsProcessing(false)
    }
  }

  // Generate and store payment reference on mount
  useEffect(() => {
    if (!paymentReference && bookingData) {
      const ref = generatePaymentReference()
      setPaymentReference(ref)
    }
  }, [bookingData, paymentReference])

  // Paystack success handler
  const handlePaystackSuccess = async (reference: any) => {
    try {
      setIsProcessing(true)

      // Create booking after successful payment
      await createBookingAfterPayment(reference.reference || reference.trxref || paymentReference)
    } catch (error) {
      console.error('Error in success handler:', error)
      alert('Payment successful but booking failed. Please contact support with reference: ' + (reference.reference || paymentReference))
    }
  }

  // Paystack close handler
  const handlePaystackClose = () => {
    setIsProcessing(false)
  }

  // Configure Paystack payment - will update when reference is set
  const paystackConfig = bookingData && user && paymentReference ? {
    email: user.email,
    amount: convertToKobo(bookingData.totalAmount || 0),
    publicKey: getPaystackPublicKey(),
    reference: paymentReference,
    currency: 'NGN',
    channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'] as any,
    metadata: {
      bookingId: 'pending',
      serviceId: bookingData.serviceId,
      serviceName: bookingData.serviceName,
      userId: user._id,
      userName: user.name,
      custom_fields: [
        {
          display_name: 'Platform',
          variable_name: 'platform',
          value: 'MetroWayz',
        },
      ],
    },
  } : {
    email: '',
    amount: 0,
    publicKey: getPaystackPublicKey(),
  }

  const initializePayment = usePaystackPayment(paystackConfig as any)

  const paymentMethods = [
    {
      id: 'paystack',
      name: 'Pay with Paystack',
      description: 'Card, Bank Transfer, USSD',
      icon: CreditCard,
    },
  ]

  const handlePayment = () => {
    if (!bookingData) return

    // Check Paystack configuration
    if (!paystackConfigured) {
      alert('Payment system is not configured. Please contact support.')
      return
    }

    if (!user?.email) {
      alert('Please log in to make a payment.')
      navigate('/login')
      return
    }

    if (!paymentReference) {
      alert('Payment reference not ready. Please try again.')
      return
    }

    // Initiate Paystack payment
    setIsProcessing(true)

    // Pass callbacks as a single object parameter
    initializePayment({
      onSuccess: (reference: any) => {
        handlePaystackSuccess(reference)
      },
      onClose: () => {
        handlePaystackClose()
      }
    } as any)
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
            Your booking is pending vendor confirmation. You will receive an email once the vendor approves or rejects your booking.
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
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">Secure Payment</h3>
              <p className="text-blue-700 text-sm leading-relaxed">
                Your payment is processed securely through Paystack. Your booking will be confirmed immediately after successful payment.
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
            {isProcessing ? 'Processing...' : `Pay ${formatCurrency(bookingData.totalAmount)}`}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage