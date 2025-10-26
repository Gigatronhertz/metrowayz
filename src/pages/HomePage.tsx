import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { categories, banners } from '../data/mockData'
import { serviceAPI } from '../services/api'
import BottomNavigation from '../components/layout/BottomNavigation'
import CategoryCard from '../components/common/CategoryCard'
import ServiceCard from '../components/common/ServiceCard'
import SearchBar from '../components/common/SearchBar'

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
  latitude?: number
  longitude?: number
  isAvailable: boolean
}

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('accommodation')
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  // Auto-scroll banners
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true)
        const response = await serviceAPI.getPublicServices({
          limit: 20,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        })
        setServices(response.data || [])
      } catch (error) {
        console.error('Error fetching services:', error)
        setServices([])
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  const filteredServices = services.filter(service => {
    const categoryLower = service.category.toLowerCase()
    switch (selectedCategory) {
      case 'accommodation':
        return categoryLower.includes('accommodation')
      case 'food-beverage':
        return categoryLower.includes('food') || categoryLower.includes('beverage')
      case 'transportation':
        return categoryLower.includes('transportation')
      case 'event-services':
        return categoryLower.includes('event')
      case 'cleaning':
        return categoryLower.includes('cleaning')
      case 'entertainment':
        return categoryLower.includes('entertainment')
      case 'health-wellness':
        return categoryLower.includes('health') || categoryLower.includes('wellness')
      case 'professional':
        return categoryLower.includes('professional')
      default:
        return true
    }
  })

  const nearbyServices = filteredServices.slice(0, 4)
  const featuredServices = filteredServices.slice(0, 2)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container-padding py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.svg"
                alt="MetroWayz Logo"
                className="w-10 h-10"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome! 👋</h1>
                <p className="text-gray-600">Your lifestyle services in one place</p>
              </div>
            </div>
            <button
              onClick={() => {/* Navigate to notifications */}}
              className="p-2 bg-gray-100 rounded-full relative"
            >
              <Bell className="w-6 h-6 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary-500 rounded-full"></span>
            </button>
          </div>

          <SearchBar
            placeholder="Search services..."
            onFilterClick={() => navigate('/search')}
          />
        </div>
      </div>

      <div className="container-padding space-y-8 py-6">
        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Services</h2>
            <button
              onClick={() => navigate('/search')}
              className="text-secondary-500 font-semibold hover:text-secondary-600"
            >
              See all
            </button>
          </div>
          <div className="flex space-x-3 overflow-x-auto pb-2">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                isSelected={selectedCategory === category.id}
                onClick={() => setSelectedCategory(category.id)}
              />
            ))}
          </div>
        </section>

        {/* Promo Banners */}
        <section>
          <div className="relative h-40 rounded-2xl overflow-hidden">
            {banners.map((banner, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentBannerIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-lg font-bold">{banner.title}</h3>
                  <p className="text-sm opacity-90">{banner.subtitle}</p>
                </div>
              </div>
            ))}
            
            {/* Dots indicator */}
            <div className="absolute bottom-4 right-4 flex space-x-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBannerIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentBannerIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Explore Nearby */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Explore nearby</h2>
            <button
              onClick={() => navigate('/search')}
              className="text-secondary-500 font-semibold hover:text-secondary-600"
            >
              See all
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {nearbyServices.map((service) => {
              const imageUrl = typeof service.images[0] === 'string'
                ? service.images[0]
                : service.images[0]?.url || '/placeholder.jpg';

              return (
                <div
                  key={service._id}
                  onClick={() => navigate(`/service/${service._id}`)}
                  className="relative h-40 rounded-xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <img
                    src={imageUrl}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <h3 className="font-semibold text-sm truncate mb-1">
                      {service.title}
                    </h3>
                    <p className="text-xs opacity-90 truncate mb-2">{service.location}</p>
                    <span className="text-sm font-bold">
                      ₦{service.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Featured Services */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Featured Services</h2>
            <button
              onClick={() => navigate('/search')}
              className="text-secondary-500 font-semibold hover:text-secondary-600"
            >
              See all
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredServices.map((service) => (
              <ServiceCard
                key={service._id}
                service={{
                  ...service,
                  id: service._id,
                  images: service.images.map(img => typeof img === 'string' ? img : img.url),
                  latitude: service.latitude || 0,
                  longitude: service.longitude || 0
                } as any}
              />
            ))}
          </div>
        </section>

        {/* More for You */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">More for you</h2>
            <button
              onClick={() => navigate('/search')}
              className="text-secondary-500 font-semibold hover:text-secondary-600"
            >
              See all
            </button>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading services...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredServices.slice(2).map((service) => {
                const imageUrl = typeof service.images[0] === 'string'
                  ? service.images[0]
                  : service.images[0]?.url || '/placeholder.jpg';

                return (
                  <div
                    key={service._id}
                    onClick={() => navigate(`/service/${service._id}`)}
                    className="bg-white rounded-xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <img
                      src={imageUrl}
                      alt={service.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-2.5">
                      <h3 className="font-semibold text-sm text-gray-900 truncate mb-1">
                        {service.title}
                      </h3>
                      <p className="text-xs text-gray-500 truncate mb-2">{service.location}</p>
                      <span className="text-sm font-bold text-primary-500">
                        ₦{service.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <BottomNavigation />
    </div>
  )
}

export default HomePage