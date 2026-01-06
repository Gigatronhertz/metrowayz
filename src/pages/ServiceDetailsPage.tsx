import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Heart, Share2, ChefHat, Users, Calendar, Check } from 'lucide-react'
import { usePaystackPayment } from 'react-paystack'
import { serviceAPI, favoriteAPI, reviewAPI, bookingAPI } from '../services/api'
import { formatCurrency, formatPriceUnit } from '../utils/format'
import { useAuth } from '../context/AuthContext'
import { isPaystackConfigured, getPaystackPublicKey } from '../config/paystack'
import { convertToKobo, generatePaymentReference } from '../services/paystack'
import MainHeader from '../components/layout/MainHeader'
import Button from '../components/ui/Button'
import Rating from '../components/ui/Rating'
import Map from '../components/common/Map'
import ImageGallery from '../components/common/ImageGallery'
import Card from '../components/ui/Card'

interface Service {
  _id: string
  title: string
  category: string
  description: string
  shortDescription?: string
  serviceType?: string
  location: string
  price: number
  priceUnit: string
  rating: number
  reviewCount: number
  images: Array<{ url: string } | string>
  amenities: string[]
  latitude: number
  longitude: number
  isAvailable: boolean
  isChefService?: boolean
  pricing?: {
    model: string
    fixed?: { basePrice: number; pricePerPerson: boolean }
    range?: { minPrice: number; maxPrice: number }
  }
  guestRules?: {
    baseGuestLimit: number
    maxGuestsAllowed: number
    extraGuestFee: number
  }
  menuItems?: string[]
  addons?: Array<{ label: string; price: number }>
  availability?: {
    availableDays: string[]
    timeSlots: Array<{ start: string; end: string }>
    blockedDates: string[]
  }
  serviceTypeOptions?: string[]
  mealPackages?: Array<{ label: string; price: number }>
  additionalNotesOptions?: string[]
}

const ServiceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isFavorite, setIsFavorite] = useState(false)
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<any[]>([])
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [guestCount, setGuestCount] = useState(2)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [paymentReference, setPaymentReference] = useState<string>('')
  const [serviceDate, setServiceDate] = useState<string>('')
  const [serviceTime, setServiceTime] = useState<string>('')
  const [selectedServiceType, setSelectedServiceType] = useState<string>('')
  const [selectedMealPackage, setSelectedMealPackage] = useState<{ label: string; price: number } | null>(null)
  const [selectedAdditionalNotes, setSelectedAdditionalNotes] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return

      try {
        setLoading(true)
        const response = await serviceAPI.getServiceById(id)
        setService(response.data)

        if (response.data.guestRules) {
          setGuestCount(response.data.guestRules.baseGuestLimit)
        }

        try {
          const favResponse = await favoriteAPI.checkFavorite(id)
          setIsFavorite(favResponse.isFavorited)
        } catch (err) {
        }

        try {
          const reviewResponse = await reviewAPI.getServiceReviews(id, { limit: 5 })
          setReviews(reviewResponse.data || [])
        } catch (err) {
          console.error('Error fetching reviews:', err)
          setReviews([])
        }
      } catch (error) {
        console.error('Error fetching service:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleToggleFavorite = async () => {
    if (!id) return

    try {
      if (isFavorite) {
        await favoriteAPI.removeFavorite(id)
      } else {
        await favoriteAPI.addFavorite(id)
      }
      setIsFavorite(!isFavorite)
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const calculateChefServicePrice = () => {
    if (!service?.pricing) return 0

    let basePrice = 0

    if (service.pricing.model === 'fixed') {
      basePrice = service.pricing.fixed?.basePrice || 0
      if (service.pricing.fixed?.pricePerPerson) {
        basePrice = basePrice * guestCount
      }
    } else {
      basePrice = service.pricing.range?.minPrice || 0
    }

    let addonPrice = 0
    if (service.addons) {
      selectedAddons.forEach((addonLabel) => {
        const addon = service.addons?.find(
          (a: { label: string; price: number }) => a.label === addonLabel
        )
        if (addon) {
          addonPrice += addon.price
        }
      })
    }

    let guestFee = 0
    if (service.guestRules && guestCount > service.guestRules.baseGuestLimit) {
      const extraGuests = guestCount - service.guestRules.baseGuestLimit
      guestFee = extraGuests * (service.guestRules.extraGuestFee || 0)
    }

    // Add meal package price if selected
    const mealPackagePrice = selectedMealPackage?.price || 0

    return basePrice + addonPrice + guestFee + mealPackagePrice
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading service...</p>
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

  const handleBookNow = () => {
    if (service?.isChefService) {
      if (!user) {
        localStorage.setItem('redirectAfterAuth', `/service/${id}`)
        navigate('/login')
        return
      }

      // Validate required fields
      if (!serviceDate) {
        alert('Please select a service date')
        return
      }

      if (!serviceTime) {
        alert('Please select a service time')
        return
      }

      // Generate payment reference and trigger payment
      const ref = generatePaymentReference()
      setPaymentReference(ref)

      // Trigger payment immediately
      setTimeout(() => {
        handlePayment()
      }, 100)
    } else {
      localStorage.setItem('redirectAfterAuth', `/booking/${service._id}`)
      navigate(`/booking/${service._id}`)
    }
  }

  const createChefBooking = async (reference: string) => {
    if (!service) return

    if (!serviceDate || !serviceTime) {
      alert('Please select both date and time for the service')
      return
    }

    setIsProcessing(true)

    try {
      const bookingResponse = await bookingAPI.createBooking({
        serviceId: service._id,
        isChefService: true,
        serviceDate,
        serviceTime,
        selectedAddons,
        guestCount,
        specialRequests: '',
        selectedServiceType,
        selectedMealPackage,
        selectedAdditionalNotes
      })

      console.log('✅ Chef booking created successfully!', bookingResponse)
      setShowSuccess(true)
    } catch (error) {
      console.error('❌ Error creating booking:', error)
      alert('Failed to create booking. Please contact support with reference: ' + reference)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaystackSuccess = async (reference: any) => {
    try {
      setIsProcessing(true)
      await createChefBooking(reference.reference || reference.trxref || paymentReference)
    } catch (error) {
      console.error('Error in success handler:', error)
      alert('Payment successful but booking failed. Please contact support with reference: ' + (reference.reference || paymentReference))
    }
  }

  const handlePaystackClose = () => {
    console.log('Payment popup closed')
    setIsProcessing(false)
  }

  const paystackConfig = service && user && paymentReference ? {
    email: user.email,
    amount: convertToKobo(calculateChefServicePrice() || 0),
    publicKey: getPaystackPublicKey(),
    reference: paymentReference,
    currency: 'NGN',
    channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'] as any,
    metadata: {
      bookingId: 'pending',
      serviceId: service._id,
      serviceName: service.title,
      userId: user._id,
      userName: user.name,
    },
  } : {
    email: '',
    amount: 0,
    publicKey: getPaystackPublicKey(),
  }

  const initializePayment = usePaystackPayment(paystackConfig as any)

  const handlePayment = () => {
    if (!isPaystackConfigured()) {
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

    // Validate date selection for private chef services
    if (!serviceDate) {
      alert('Please select a service date before proceeding with payment.')
      return
    }

    if (!serviceTime) {
      alert('Please select a service time before proceeding with payment.')
      return
    }

    setIsProcessing(true)

    initializePayment({
      onSuccess: (reference: any) => {
        console.log('✅ onSuccess callback triggered!', reference)
        handlePaystackSuccess(reference)
      },
      onClose: () => {
        console.log('❌ onClose callback triggered!')
        handlePaystackClose()
      }
    } as any)
  }

  const handleSuccessClose = () => {
    setShowSuccess(false)
    navigate('/bookings')
  }

  const imageUrls = service.images.map(img => typeof img === 'string' ? img : img.url)
  const finalPrice = service.isChefService ? calculateChefServicePrice() : service.price

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

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-0">
      <MainHeader showSearch={false} />

      <div className="relative">
        <ImageGallery images={imageUrls} title={service.title} />

        <div className="absolute top-4 right-4 z-10 flex space-x-2">
          <button
            onClick={handleToggleFavorite}
            className="p-3 bg-white/90 rounded-full shadow-lg"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
          <button className="p-3 bg-white/90 rounded-full shadow-lg">
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 mr-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {service.title}
              </h1>
              {service.isChefService && service.serviceType && (
                <div className="flex items-center gap-2 text-sm text-primary-600 font-medium">
                  <ChefHat size={16} />
                  {service.serviceType.replace(/_/g, ' ').charAt(0).toUpperCase() + service.serviceType.replace(/_/g, ' ').slice(1)}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-500">
                {formatCurrency(finalPrice)}
              </div>
              {!service.isChefService && (
                <div className="text-sm text-gray-500">{formatPriceUnit(service.priceUnit, 'long')}</div>
              )}
            </div>
          </div>

          <div className="flex items-center mb-3 text-gray-600">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{service.location}</span>
          </div>

          <div className="flex items-center">
            <Rating value={service.rating} size="sm" />
            <span className="ml-2 text-sm text-gray-600">
              {service.rating} ({service.reviewCount} reviews)
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
          <p className="text-gray-600 leading-relaxed">{service.description}</p>
        </div>

        {service.isChefService && (
          <>
            {service.pricing?.model === 'range' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Base price: {formatCurrency(service.pricing.range?.minPrice || 0)} - {formatCurrency(service.pricing.range?.maxPrice || 0)}
                </p>
              </div>
            )}

            {service.menuItems && service.menuItems.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu Items</h2>
                <div className="grid grid-cols-2 gap-3">
                  {service.menuItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-primary-50 rounded-lg border border-primary-100">
                      <ChefHat className="w-4 h-4 text-primary-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {service.addons && service.addons.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Premium Add-ons</h2>
                <div className="space-y-3">
                  {service.addons.map((addon, idx) => (
                    <label key={idx} className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedAddons.includes(addon.label)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAddons([...selectedAddons, addon.label])
                          } else {
                            setSelectedAddons(selectedAddons.filter(a => a !== addon.label))
                          }
                        }}
                        className="rounded"
                      />
                      <span className="flex-1 font-medium text-gray-900">{addon.label}</span>
                      <span className="font-semibold text-primary-600">{formatCurrency(addon.price)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Booking Form */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h2>
              <div className="space-y-4">
                {/* Service Type */}
                {service.serviceTypeOptions && service.serviceTypeOptions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Type *
                    </label>
                    <select
                      value={selectedServiceType}
                      onChange={(e) => setSelectedServiceType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select service type...</option>
                      {service.serviceTypeOptions.map((option, idx) => (
                        <option key={idx} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Meal Package */}
                {service.mealPackages && service.mealPackages.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meal Package *
                    </label>
                    <select
                      value={selectedMealPackage?.label || ''}
                      onChange={(e) => {
                        const pkg = service.mealPackages?.find(p => p.label === e.target.value)
                        setSelectedMealPackage(pkg || null)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select meal package...</option>
                      {service.mealPackages.map((pkg, idx) => (
                        <option key={idx} value={pkg.label}>
                          {pkg.label} - {formatCurrency(pkg.price)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Dietary Preferences */}
                {service.additionalNotesOptions && service.additionalNotesOptions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dietary Preferences (Optional)
                    </label>
                    <select
                      value={selectedAdditionalNotes}
                      onChange={(e) => setSelectedAdditionalNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select dietary preference...</option>
                      {service.additionalNotesOptions.map((option, idx) => (
                        <option key={idx} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Number of Guests */}
                {service.guestRules && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <Users size={16} />
                        Number of Guests
                      </div>
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                      >
                        -
                      </button>
                      <span className="text-center min-w-16 font-bold text-lg">{guestCount} guests</span>
                      <button
                        onClick={() => setGuestCount(Math.min(service.guestRules!.maxGuestsAllowed, guestCount + 1))}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Base: {service.guestRules.baseGuestLimit}, Max: {service.guestRules.maxGuestsAllowed}
                    </p>
                    {guestCount > service.guestRules.baseGuestLimit && service.guestRules.extraGuestFee > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        +{formatCurrency(service.guestRules.extraGuestFee)} per extra guest
                      </p>
                    )}
                  </div>
                )}

                {/* Date & Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      Service Date *
                    </div>
                  </label>
                  <input
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {serviceDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Time *
                    </label>
                    {service.availability?.timeSlots && service.availability.timeSlots.length > 0 ? (
                      <div className="space-y-2">
                        {service.availability.timeSlots.map((slot, idx) => (
                          <label key={idx} className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <input
                              type="radio"
                              name="timeSlot"
                              value={slot.start}
                              checked={serviceTime === slot.start}
                              onChange={(e) => setServiceTime(e.target.value)}
                              className="text-primary-600"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {slot.start} - {slot.end}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="time"
                        value={serviceTime}
                        onChange={(e) => setServiceTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {!service.isChefService && service.amenities && service.amenities.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {service.amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Location</h2>
          <div className="h-64 rounded-2xl overflow-hidden relative z-0">
            <Map
              latitude={service.latitude}
              longitude={service.longitude}
              title={service.title}
              zoom={14}
              className="h-full w-full"
            />
          </div>
          <div className="mt-3 flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="text-sm">{service.location}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Reviews</h2>
            {reviews.length > 0 && (
              <button className="text-primary-500 font-semibold">See all</button>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-6 text-center">
              <p className="text-gray-500">No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 3).map((review) => (
                <div key={review._id} className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      {review.userAvatar ? (
                        <img src={review.userAvatar} alt={review.userName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-sm font-semibold text-gray-600">
                          {review.userName?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900">{review.userName}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Rating value={review.rating} size="sm" />
                      <p className="text-gray-600 mt-2 text-sm">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xl font-bold text-primary-500">
              {formatCurrency(finalPrice)}
            </div>
            {!service.isChefService && (
              <div className="text-sm text-gray-500">{formatPriceUnit(service.priceUnit, 'long')}</div>
            )}
          </div>
          <Button onClick={handleBookNow} className="px-8" isLoading={isProcessing} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Book Now'}
          </Button>
        </div>
      </div>

      <div className="h-20"></div>
    </div>
  )
}

export default ServiceDetailsPage
