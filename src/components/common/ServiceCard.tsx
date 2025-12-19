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
      <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl lg:rounded-3xl shadow-luxury hover:shadow-luxury-hover transition-all duration-500 overflow-hidden transform hover:-translate-y-2 border border-white/40 hover:border-primary-200/50">
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/40 to-white/30 backdrop-blur-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative overflow-hidden aspect-square lg:aspect-auto">
          <img
            src={imageUrl}
            alt={service.title}
            className="w-full h-full lg:h-64 object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {/* Enhanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Favorite button with glassmorphism */}
          <button
            className="absolute top-3 right-3 lg:top-4 lg:right-4 p-2 lg:p-3 bg-white/30 backdrop-blur-md rounded-full hover:bg-white/50 transition-all duration-300 shadow-lg hover:scale-110 border border-white/40"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Heart className="w-4 h-4 lg:w-5 lg:h-5 text-white hover:text-red-400 transition-colors drop-shadow-lg" />
          </button>

          {/* Category badge with glassmorphism */}
          <div className="absolute top-3 left-3 lg:top-4 lg:left-4 px-3 py-1.5 lg:px-4 lg:py-2 bg-gradient-to-r from-secondary-500/90 to-secondary-600/90 backdrop-blur-md rounded-full text-[10px] lg:text-xs font-bold text-white shadow-lg border border-white/20">
            <span className="line-clamp-1 drop-shadow-sm">{service.category}</span>
          </div>

          {/* Rating badge with enhanced glassmorphism */}
          {service.rating && service.rating > 0 && (
            <div className="absolute bottom-3 left-3 lg:bottom-4 lg:left-4 flex items-center gap-1 lg:gap-1.5 px-3 py-1.5 lg:px-4 lg:py-2 bg-white/95 backdrop-blur-md rounded-full shadow-luxury border border-white/40 group-hover:bg-white transition-all duration-300">
              <Star className="w-3.5 h-3.5 lg:w-4 lg:h-4 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
              <span className="text-xs lg:text-sm font-bold text-gray-900">{service.rating.toFixed(1)}</span>
              {service.reviewCount && service.reviewCount > 0 && (
                <span className="hidden lg:inline text-xs text-gray-600">({service.reviewCount})</span>
              )}
            </div>
          )}
        </div>

        <div className="relative p-4 lg:p-6 bg-gradient-to-b from-white/50 to-white/80 backdrop-blur-sm">
          <h3 className="font-display font-bold text-sm lg:text-xl text-gray-900 mb-2 lg:mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
            {service.title}
          </h3>

          <div className="flex items-center mb-3 lg:mb-4 text-xs lg:text-sm text-gray-600">
            <MapPin className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1.5 lg:mr-2 text-primary-400 flex-shrink-0" />
            <span className="line-clamp-1 truncate">{service.location}</span>
          </div>

          <div className="flex items-end justify-between pt-3 lg:pt-4 border-t border-gray-200/50">
            <div className="min-w-0 flex-1">
              <div className="text-lg lg:text-3xl font-display font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent truncate">
                {formatCurrency(service.price)}
              </div>
              <div className="text-[10px] lg:text-sm text-gray-500 mt-1 truncate">{getPriceUnitDisplay()}</div>
            </div>
            <button className="hidden lg:flex items-center px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm font-bold rounded-xl transition-all duration-300 whitespace-nowrap ml-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceCard
