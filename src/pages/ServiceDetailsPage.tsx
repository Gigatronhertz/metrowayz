import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Heart, Share2, Calendar, Users } from 'lucide-react'
import { services } from '../data/mockData'
import { formatCurrency } from '../utils/format'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Rating from '../components/ui/Rating'

const ServiceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)

  const service = services.find(s => s.id === id)

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
    navigate(`/booking/${service.id}`)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Image Gallery */}
      <div className="relative h-80">
        <img
          src={service.images[currentImageIndex]}
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
            onClick={() => setIsFavorite(!isFavorite)}
            className="p-3 bg-white/90 rounded-full shadow-lg"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
          <button className="p-3 bg-white/90 rounded-full shadow-lg">
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Image Indicators */}
        {service.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {service.images.map((_, index) => (
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
              <div className="text-sm text-gray-500">per {service.priceUnit}</div>
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

        {/* Quick Actions */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="flex-1 flex items-center justify-center"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Check Availability
          </Button>
          <Button
            variant="outline"
            className="flex-1 flex items-center justify-center"
          >
            <Users className="w-4 h-4 mr-2" />
            Contact Host
          </Button>
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
          <div className="h-48 bg-gray-200 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Interactive map would go here</p>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Reviews</h2>
            <button className="text-primary-500 font-semibold">See all</button>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-600">JD</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900">John D.</span>
                  <span className="text-sm text-gray-500">2 days ago</span>
                </div>
                <Rating value={5} size="sm" />
                <p className="text-gray-600 mt-2 text-sm">
                  Amazing service with great attention to detail. Highly recommended for anyone looking for quality and professionalism.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xl font-bold text-primary-500">
              {formatCurrency(service.price)}
            </div>
            <div className="text-sm text-gray-500">per {service.priceUnit}</div>
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