import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Heart, Share2, ChefHat, Users, Calendar } from 'lucide-react'
import { serviceAPI, favoriteAPI, reviewAPI } from '../services/api'
import { formatCurrency, formatPriceUnit } from '../utils/format'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Rating from '../components/ui/Rating'
import Map from '../components/common/Map'
import ImageGallery from '../components/common/ImageGallery'

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
  menuParameters?: Array<{
    name: string
    label: string
    type: string
    options: Array<{ label: string; value: string; priceEffect: number }>
  }>
  addons?: Array<{ label: string; price: number }>
  availability?: {
    availableDays: string[]
    timeSlots: Array<{ start: string; end: string }>
    blockedDates: string[]
  }
}

const ServiceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isFavorite, setIsFavorite] = useState(false)
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<any[]>([])
  const [selectedMenuOptions, setSelectedMenuOptions] = useState<{ [key: string]: string | string[] | undefined }>({})
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [guestCount, setGuestCount] = useState(2)

  // Fetch service details
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

        // Check if favorited
        try {
          const favResponse = await favoriteAPI.checkFavorite(id)
          setIsFavorite(favResponse.isFavorited)
        } catch (err) {
          // User might not be logged in
        }

        // Fetch reviews
        try {
          const reviewResponse = await reviewAPI.getServiceReviews(id, { limit: 5 })
          setReviews(reviewResponse.data || [])
        } catch (err) {
          console.error('Error fetching reviews:', err)
          setReviews([]) // Set empty array on error
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

    let menuPrice = 0
    if (service.menuParameters) {
      service.menuParameters.forEach((param) => {
        const selected = selectedMenuOptions[param.name]
        if (selected) {
          const option = param.options.find(
            (opt: { label: string; value: string; priceEffect: number }) => opt.value === selected
          )
          if (option) {
            menuPrice += option.priceEffect || 0
          }
        }
      })
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

    return basePrice + menuPrice + addonPrice + guestFee
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
      const chefBookingData = {
        serviceId: service._id,
        serviceName: service.title,
        serviceLocation: service.location,
        isChefService: true,
        totalAmount: calculateChefServicePrice(),
        selectedMenuOptions,
        selectedAddons,
        guestCount,
        pricing: service.pricing,
        guestRules: service.guestRules
      }
      localStorage.setItem('pendingBooking', JSON.stringify(chefBookingData))
      navigate('/payment')
    } else {
      localStorage.setItem('redirectAfterAuth', `/booking/${service._id}`)
      navigate(`/booking/${service._id}`)
    }
  }

  const imageUrls = service.images.map(img => typeof img === 'string' ? img : img.url)
  const finalPrice = service.isChefService ? calculateChefServicePrice() : service.price

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Back Button */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <Header showBack />
      </div>

      {/* Image Gallery */}
      <div className="relative">
        <ImageGallery images={imageUrls} title={service.title} />
        
        {/* Action Buttons - Overlay on gallery */}
        <div className="absolute top-16 right-4 z-10 flex space-x-2">
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

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Header Info */}
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

        {/* Short Description for Chef Services */}
        {service.isChefService && service.shortDescription && (
          <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
            <p className="text-gray-700 font-medium">{service.shortDescription}</p>
          </div>
        )}

        {/* Description */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
          <p className="text-gray-600 leading-relaxed">{service.description}</p>
        </div>

        {/* Chef Service Details */}
        {service.isChefService && (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Booking Details</h2>
              
              {service.pricing?.model === 'range' && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Base price: {formatCurrency(service.pricing.range?.minPrice || 0)} - {formatCurrency(service.pricing.range?.maxPrice || 0)}
                  </p>
                </div>
              )}

              {service.guestRules && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      Number of Guests
                    </div>
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      -
                    </button>
                    <span className="text-center min-w-12 font-semibold">{guestCount}</span>
                    <button
                      onClick={() => setGuestCount(Math.min(service.guestRules!.maxGuestsAllowed, guestCount + 1))}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      +
                    </button>
                    <span className="text-xs text-gray-500">
                      (Base: {service.guestRules.baseGuestLimit}, Max: {service.guestRules.maxGuestsAllowed})
                    </span>
                  </div>
                  {guestCount > service.guestRules.baseGuestLimit && service.guestRules.extraGuestFee > 0 && (
                    <p className="text-xs text-gray-600 mt-2">
                      +{formatCurrency(service.guestRules.extraGuestFee)} per extra guest
                    </p>
                  )}
                </div>
              )}
            </div>

            {service.menuParameters && service.menuParameters.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu Options</h2>
                <div className="space-y-4">
                  {service.menuParameters.map((param, idx) => (
                    <div key={idx}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {param.label}
                      </label>
                      {param.type === 'boolean' ? (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedMenuOptions[param.name] === 'true'}
                            onChange={(e) => {
                              const updated = { ...selectedMenuOptions }
                              if (e.target.checked) {
                                updated[param.name] = 'true'
                              } else {
                                delete updated[param.name]
                              }
                              setSelectedMenuOptions(updated)
                            }}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-600">{param.label}</span>
                        </label>
                      ) : param.type === 'multi_select' ? (
                        <div className="space-y-2">
                          {param.options.map((option: any, optIdx: number) => (
                            <label key={optIdx} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={(selectedMenuOptions[param.name] || []).includes(option.value)}
                                onChange={(e) => {
                                  const current = (selectedMenuOptions[param.name] as string[]) || []
                                  const updated = e.target.checked
                                    ? [...current, option.value]
                                    : current.filter((v: string) => v !== option.value)
                                  setSelectedMenuOptions({
                                    ...selectedMenuOptions,
                                    [param.name]: updated
                                  })
                                }}
                                className="rounded"
                              />
                              <span className="text-sm text-gray-600">
                                {option.label}
                                {option.priceEffect > 0 && (
                                  <span className="text-primary-600 font-medium ml-1">
                                    +{formatCurrency(option.priceEffect)}
                                  </span>
                                )}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <select
                          value={selectedMenuOptions[param.name] || ''}
                          onChange={(e) => 
                            setSelectedMenuOptions({
                              ...selectedMenuOptions,
                              [param.name]: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Select an option...</option>
                          {param.options.map((option: any, optIdx: number) => (
                            <option key={optIdx} value={option.value}>
                              {option.label}
                              {option.priceEffect > 0 && ` (+${formatCurrency(option.priceEffect)})`}
                            </option>
                          ))}
                        </select>
                      )}
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

            {service.availability && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Availability</h2>
                <div className="space-y-3">
                  {service.availability.availableDays && service.availability.availableDays.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Available Days</p>
                      <div className="flex flex-wrap gap-2">
                        {service.availability.availableDays.map((day, idx) => (
                          <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {service.availability.timeSlots && service.availability.timeSlots.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Time Slots</p>
                      <div className="space-y-2">
                        {service.availability.timeSlots.map((slot, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={14} />
                            {slot.start} - {slot.end}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Amenities (for non-chef services) */}
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

        {/* Location */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Location</h2>
          <div className="h-64 rounded-2xl overflow-hidden">
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

        {/* Reviews */}
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

      {/* Booking Footer */}
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
          <Button onClick={handleBookNow} className="px-8">
            Book Now
          </Button>
        </div>
      </div>

      {/* Add bottom padding to account for fixed footer */}
      <div className="h-20"></div>
    </div>
  )
}

export default ServiceDetailsPage