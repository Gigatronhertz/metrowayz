import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, MessageSquare } from 'lucide-react'
import { serviceAPI } from '../services/api'
import { formatCurrency } from '../utils/format'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'

interface Service {
  _id: string
  title: string
  location: string
  price: number
  priceUnit: string
  images: Array<{ url: string } | string>
}

const BookingPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>()
  const navigate = useNavigate()

  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch service details
  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) return

      try {
        setLoading(true)
        const response = await serviceAPI.getServiceById(serviceId)
        setService(response.data)
      } catch (error) {
        console.error('Error fetching service:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchService()
  }, [serviceId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Service not found</h2>
          <Button onClick={() => navigate('/search')}>
            Back to Search
          </Button>
        </div>
      </div>
    )
  }

  const calculateTotal = () => {
    if (!checkInDate || !checkOutDate) return 0

    const startDate = new Date(checkInDate)
    const endDate = new Date(checkOutDate)
    const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    const subtotal = service.price * Math.max(nights, 1)
    const serviceFee = subtotal * 0.05 // 5% service fee
    return subtotal + serviceFee
  }

  const canProceed = checkInDate && checkOutDate

  const handleContinue = () => {
    if (canProceed) {
      // Store booking data in localStorage to pass to payment page
      const bookingData = {
        serviceId: service._id,
        serviceName: service.title,
        serviceLocation: service.location,
        servicePrice: service.price,
        servicePriceUnit: service.priceUnit,
        checkInDate,
        checkOutDate,
        specialRequests,
        totalAmount: calculateTotal()
      }
      localStorage.setItem('pendingBooking', JSON.stringify(bookingData))
      navigate('/payment')
    }
  }

  const imageUrl = typeof service.images[0] === 'string'
    ? service.images[0]
    : service.images[0]?.url || '/placeholder.jpg'

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Book Service" showBack />

      <div className="container-padding py-6 space-y-6">
        {/* Service Summary */}
        <Card className="p-4">
          <div className="flex space-x-4">
            <img
              src={imageUrl}
              alt={service.title}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">{service.title}</h2>
              <p className="text-gray-600 text-sm">{service.location}</p>
              <p className="text-primary-500 font-semibold mt-1">
                {formatCurrency(service.price)} per {service.priceUnit}
              </p>
            </div>
          </div>
        </Card>

        {/* Date Selection */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Select Dates
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Check-in"
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <Input
              label="Check-out"
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              min={checkInDate || new Date().toISOString().split('T')[0]}
            />
          </div>
        </Card>

        {/* Special Requests */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Special Requests
          </h3>
          
          <textarea
            placeholder="Any special requests or preferences..."
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={4}
          />
        </Card>

        {/* Price Breakdown */}
        {checkInDate && checkOutDate && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Breakdown</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {formatCurrency(service.price)} × {Math.max(1, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)))} {service.priceUnit}s
                </span>
                <span className="font-semibold">
                  {formatCurrency(service.price * Math.max(1, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24))))}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Service fee</span>
                <span className="font-semibold">
                  {formatCurrency(calculateTotal() * 0.05 / 1.05)}
                </span>
              </div>
              
              <div className="border-t pt-3 flex justify-between">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold text-primary-500">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Continue Button */}
        <div className="pb-6">
          <Button
            onClick={handleContinue}
            disabled={!canProceed}
            className="w-full"
          >
            Continue to Payment
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BookingPage