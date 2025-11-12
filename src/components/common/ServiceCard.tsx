import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Heart, Star } from 'lucide-react'
import { Service } from '../../types'
import { formatCurrency, formatPriceUnit } from '../../utils/format'
import Card from '../ui/Card'

interface ServiceCardProps {
  service: Service
  variant?: 'default' | 'compact'
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, variant = 'default' }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/service/${service.id}`)
  }

  const getImageUrl = (img: string | { url: string; publicId: string } | undefined): string => {
    if (!img) return '/placeholder.jpg';
    return typeof img === 'string' ? img : img.url;
  };

  const imageUrl = service.images && service.images.length > 0
    ? getImageUrl(service.images[0])
    : '/placeholder.jpg';

  if (variant === 'compact') {
    return (
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={handleClick}
      >
        <div className="flex p-4 space-x-4">
          <div className="relative">
            <img
              src={imageUrl}
              alt={service.title}
              className="w-28 h-28 rounded-lg object-cover"
            />
            <button className="absolute top-1 right-1 p-1 bg-white/80 rounded-full">
              <Heart className="w-3 h-3 text-gray-600" />
            </button>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{service.title}</h3>
            <div className="flex items-center mt-1 text-sm text-gray-500">
              <MapPin className="w-3 h-3 mr-1" />
              <span className="truncate">{service.location}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="font-bold text-primary-500 text-sm">
              {formatCurrency(service.price)}
            </div>
            <div className="text-xs text-gray-500">{formatPriceUnit(service.priceUnit, 'short')}</div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div
      className="cursor-pointer group"
      onClick={handleClick}
    >
      <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
        <div className="relative overflow-hidden">
          <img
            src={imageUrl}
            alt={service.title}
            className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <button
            className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 shadow-lg hover:scale-110"
            onClick={(e) => {
              e.stopPropagation();
              // Add to favorites logic here
            }}
          >
            <Heart className="w-5 h-5 text-gray-700 hover:text-red-500 transition-colors" />
          </button>

          <div className="absolute top-4 left-4 px-3 py-1.5 bg-secondary-500 rounded-full text-xs font-semibold text-white shadow-lg">
            {service.category}
          </div>

          {/* Rating badge */}
          {service.rating && service.rating > 0 && (
            <div className="absolute bottom-4 left-4 flex items-center gap-1 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full shadow-lg">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-bold text-gray-900">{service.rating.toFixed(1)}</span>
              {service.reviewCount && service.reviewCount > 0 && (
                <span className="text-xs text-gray-600">({service.reviewCount})</span>
              )}
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="font-display font-bold text-lg text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
            {service.title}
          </h3>

          <div className="flex items-center mb-4 text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
            <span className="line-clamp-1">{service.location}</span>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-gray-100">
            <div>
              <div className="text-2xl font-display font-bold text-primary-600">
                {formatCurrency(service.price)}
              </div>
              <div className="text-sm text-gray-500 mt-0.5">{formatPriceUnit(service.priceUnit, 'long')}</div>
            </div>
            <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-colors duration-200">
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceCard