import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { categories, banners } from '../data/mockData'
import { serviceAPI } from '../services/api'
import { formatPriceUnit } from '../utils/format'
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
        console.log('Fetched services:', response.data)
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
      case 'private-chefs':
        return categoryLower.includes('chef') || categoryLower.includes('private chef')
      case 'entertainment':
        return categoryLower.includes('entertainment')
      case 'accommodation':
        return categoryLower.includes('accommodation')
      case 'professional':
        // Professional Services includes: Transportation, Events, Cleaning, Health & Wellness, and Professional Services
        return categoryLower.includes('professional') ||
               categoryLower.includes('transportation') ||
               categoryLower.includes('event') ||
               categoryLower.includes('cleaning') ||
               categoryLower.includes('health') ||
               categoryLower.includes('wellness')
      default:
        return true
    }
  })

  const nearbyServices = filteredServices.slice(0, 4)
  const featuredServices = filteredServices.slice(0, 2)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Header */}
      <div className="bg-white shadow-soft">
        <div className="container-padding py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <img
                src="/logo.svg"
                alt="MetroWayz Logo"
                className="w-12 h-12"
              />
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900">Welcome! 👋</h1>
                <p className="text-gray-600 text-sm mt-1">Your lifestyle services in one place</p>
              </div>
            </div>
            <button
              onClick={() => {/* Navigate to notifications */}}
              className="p-3 bg-gray-100 rounded-full relative hover:bg-gray-200 transition-colors"
            >
              <Bell className="w-6 h-6 text-gray-700" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full border-2 border-white"></span>
            </button>
          </div>

          {/* Enhanced Search Bar */}
          <div className="max-w-2xl">
            <SearchBar
              placeholder="Search for services, chefs, venues..."
              onFilterClick={() => navigate('/search')}
            />
          </div>
        </div>
      </div>

      <div className="container-padding space-y-10 py-8">
        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900">Explore Services</h2>
              <p className="text-sm text-gray-600 mt-1">Discover what you need, when you need it</p>
            </div>
            <button
              onClick={() => navigate('/search')}
              className="text-primary-600 font-semibold hover:text-primary-700 transition-colors text-sm"
            >
              See all →
            </button>
          </div>
          <div className="flex space-x-4 overflow-x-auto pb-3 scrollbar-hide">
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900">Popular Near You</h2>
              <p className="text-sm text-gray-600 mt-1">Top-rated services in your area</p>
            </div>
            <button
              onClick={() => navigate('/search')}
              className="text-primary-600 font-semibold hover:text-primary-700 transition-colors text-sm"
            >
              See all →
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {nearbyServices.map((service) => {
              const imageUrl = service.images && service.images.length > 0
                ? (typeof service.images[0] === 'string'
                    ? service.images[0]
                    : service.images[0]?.url)
                : '/placeholder.jpg';

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
                    <div className="text-sm font-bold">
                      ₦{service.price.toLocaleString()}
                      <span className="text-xs font-normal opacity-90"> {formatPriceUnit(service.priceUnit, 'short')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Featured Services */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900">Featured Services</h2>
              <p className="text-sm text-gray-600 mt-1">Hand-picked selections just for you</p>
            </div>
            <button
              onClick={() => navigate('/search')}
              className="text-primary-600 font-semibold hover:text-primary-700 transition-colors text-sm"
            >
              See all →
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredServices.map((service) => (
              <ServiceCard
                key={service._id}
                service={{
                  ...service,
                  id: service._id,
                  images: service.images && Array.isArray(service.images)
                    ? service.images.map(img => typeof img === 'string' ? img : img?.url || '/placeholder.jpg')
                    : ['/placeholder.jpg'],
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
                const imageUrl = service.images && service.images.length > 0
                  ? (typeof service.images[0] === 'string'
                      ? service.images[0]
                      : service.images[0]?.url)
                  : '/placeholder.jpg';

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
                      <div className="text-sm font-bold text-primary-500">
                        ₦{service.price.toLocaleString()}
                        <span className="text-xs font-normal text-gray-500"> {formatPriceUnit(service.priceUnit, 'short')}</span>
                      </div>
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