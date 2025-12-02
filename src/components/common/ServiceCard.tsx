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

  const getPriceUnitDisplay = () => {
    return service.isChefService ? 'per service' : formatPriceUnit(service.priceUnit, 'long');
  };

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
            <div className="text-xs text-gray-500">{service.isChefService ? 'per service' : formatPriceUnit(service.priceUnit, 'short')}</div>
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
      <div className="bg-white rounded-xl lg:rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
        <div className="relative overflow-hidden aspect-square lg:aspect-auto">
          <img
            src={imageUrl}
            alt={service.title}
            className="w-full h-full lg:h-56 object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <button
            className="absolute top-2 right-2 lg:top-4 lg:right-4 p-1.5 lg:p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 shadow-lg hover:scale-110"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Heart className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-gray-700 hover:text-red-500 transition-colors" />
          </button>

          <div className="absolute top-2 left-2 lg:top-4 lg:left-4 px-2 py-1 lg:px-3 lg:py-1.5 bg-secondary-500 rounded-full text-[10px] lg:text-xs font-semibold text-white shadow-lg">
            <span className="line-clamp-1">{service.category}</span>
          </div>

          {/* Rating badge */}
          {service.rating && service.rating > 0 && (
            <div className="absolute bottom-2 left-2 lg:bottom-4 lg:left-4 flex items-center gap-0.5 lg:gap-1 px-2 py-1 lg:px-3 lg:py-1.5 bg-white/95 backdrop-blur-sm rounded-full shadow-lg">
              <Star className="w-3 h-3 lg:w-4 lg:h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-xs lg:text-sm font-bold text-gray-900">{service.rating.toFixed(1)}</span>
              {service.reviewCount && service.reviewCount > 0 && (
                <span className="hidden lg:inline text-xs text-gray-600">({service.reviewCount})</span>
              )}
            </div>
          )}
        </div>

        <div className="p-3 lg:p-5">
          <h3 className="font-display font-bold text-sm lg:text-lg text-gray-900 mb-1.5 lg:mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
            {service.title}
          </h3>

          <div className="flex items-center mb-2 lg:mb-4 text-xs lg:text-sm text-gray-600">
            <MapPin className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-1.5 text-gray-400 flex-shrink-0" />
            <span className="line-clamp-1 truncate">{service.location}</span>
          </div>

          <div className="flex items-end justify-between pt-2 lg:pt-3 border-t border-gray-100">
            <div className="min-w-0 flex-1">
              <div className="text-base lg:text-2xl font-display font-bold text-primary-600 truncate">
                {formatCurrency(service.price)}
              </div>
              <div className="text-[10px] lg:text-sm text-gray-500 mt-0.5 truncate">{getPriceUnitDisplay()}</div>
            </div>
            <button className="hidden lg:block px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-colors duration-200 whitespace-nowrap ml-2">
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceCard
