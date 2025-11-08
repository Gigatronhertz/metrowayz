import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Heart, Share2 } from 'lucide-react'
import { serviceAPI, favoriteAPI, reviewAPI } from '../services/api'
import { formatCurrency, formatPriceUnit } from '../utils/format'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Rating from '../components/ui/Rating'
import Map from '../components/common/Map'

interface Service {
  _id: string
  title: string
  category: string
  description: string
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
}

const ServiceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<any[]>([])

  // Fetch service details
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return

      try {
        setLoading(true)
        const response = await serviceAPI.getServiceById(id)
        setService(response.data)

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
    navigate(`/booking/${service._id}`)
  }

  const imageUrls = service.images.map(img => typeof img === 'string' ? img : img.url)

  return (
    <div className="min-h-screen bg-white">
      {/* Image Gallery */}
      <div className="relative h-80">
        <img
          src={imageUrls[currentImageIndex] || '/placeholder.jpg'}
          alt={service.title}
          className="w-full h-full object-cover"
        />

        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0">
          <Header showBack />
        </div>

        {/* Action Buttons */}
        <div className="absolute top-16 right-4 flex space-x-2">
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

        {/* Image Indicators */}
        {imageUrls.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {imageUrls.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Header Info */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900 flex-1 mr-4">
              {service.title}
            </h1>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-500">
                {formatCurrency(service.price)}
              </div>
              <div className="text-sm text-gray-500">{formatPriceUnit(service.priceUnit, 'long')}</div>
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

        {/* Description */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
          <p className="text-gray-600 leading-relaxed">{service.description}</p>
        </div>

        {/* Amenities */}
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
              {formatCurrency(service.price)}
            </div>
            <div className="text-sm text-gray-500">{formatPriceUnit(service.priceUnit, 'long')}</div>
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