import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Heart } from 'lucide-react'
import { Service } from '../../types'
import { formatCurrency } from '../../utils/format'
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

  if (variant === 'compact') {
    return (
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={handleClick}
      >
        <div className="flex p-4 space-x-4">
          <div className="relative">
            <img
              src={service.images[0]}
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
            <div className="font-bold text-primary-500">
              {formatCurrency(service.price)}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow group"
      onClick={handleClick}
    >
      <div className="relative">
        <img
          src={service.images[0]}
          alt={service.title}
          className="w-full h-48 object-cover"
        />
        <button className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white transition-colors">
          <Heart className="w-4 h-4 text-gray-600" />
        </button>
        <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 rounded-lg text-xs font-medium text-primary-500">
          {service.category}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-500 transition-colors">
          {service.title}
        </h3>
        
        <div className="flex items-center mb-3 text-sm text-gray-500">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{service.location}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-primary-500">
              {formatCurrency(service.price)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default ServiceCard