import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Wallet, Building2, Check } from 'lucide-react'
import { formatCurrency } from '../utils/format'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const PaymentPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('wallet')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Mock booking data - in real app this would come from context/state
  const bookingData = {
    serviceName: 'Luxury Apartment',
    duration: '2 nights',
    totalAmount: 52500
  }

  const paymentMethods = [
    {
      id: 'wallet',
      name: 'MetroWayz Wallet',
      description: 'Balance: ₦75,000',
      icon: Wallet,
    },
    {
      id: 'card',
      name: 'Visa Card •••• 1234',
      description: 'Expires 12/26',
      icon: CreditCard,
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      description: 'Paystack, Flutterwave',
      icon: Building2,
    },
  ]

  const handlePayment = async () => {
    setIsProcessing(true)
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    setIsProcessing(false)
    setShowSuccess(true)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Payment" showBack />

      <div className="container-padding py-6 space-y-6">
        {/* Payment Summary */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Service:</span>
              <span className="font-semibold">{bookingData.serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-semibold">{bookingData.duration}</span>
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

        {/* Cancellation Policy */}
        <Card className="p-6 bg-amber-50 border-amber-200">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-sm font-bold">!</span>
            </div>
            <div>
              <h3 className="font-semibold text-amber-800 mb-2">Cancellation Policy</h3>
              <p className="text-amber-700 text-sm leading-relaxed">
                Free cancellation up to 24 hours before check-in. After that, you may be charged 50% of the booking amount.
              </p>
            </div>
          </div>
        </Card>

        {/* Payment Button */}
        <div className="pb-6">
          <Button
            onClick={handlePayment}
            isLoading={isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Processing Payment...' : `Pay ${formatCurrency(bookingData.totalAmount)}`}
          </Button>
          
          <Button
            variant="outline"
            className="w-full mt-3"
            onClick={() => {/* Add payment method logic */}}
          >
            Add Payment Method
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage