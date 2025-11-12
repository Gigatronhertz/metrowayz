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
    <div className="min-h-screen bg-white pb-20 lg:pb-0">
      {/* Desktop Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container-max py-4 lg:py-5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <img src="/logo.svg" alt="MetroWayz" className="w-10 h-10 lg:w-12 lg:h-12" />
              <div>
                <h1 className="text-xl lg:text-2xl font-display font-bold text-gray-900">MetroWayz</h1>
                <p className="hidden lg:block text-xs text-gray-500">Premium Lifestyle Services</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <button className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">
                Services
              </button>
              <button className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">
                Become a Vendor
              </button>
              <button className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">
                Help
              </button>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {/* Navigate to notifications */}}
                className="relative p-2.5 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <Bell className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full"></span>
              </button>
              <button
                onClick={() => navigate('/login')}
                className="hidden lg:block px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 lg:py-20">
        <div className="container-max">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <h2 className="text-4xl lg:text-6xl font-display font-bold text-gray-900 mb-4 lg:mb-6">
              Discover Premium
              <span className="block text-primary-600">Lifestyle Services</span>
            </h2>
            <p className="text-lg lg:text-xl text-gray-600 mb-8 lg:mb-10 max-w-2xl mx-auto">
              Book private chefs, luxury accommodations, entertainment, and professional services with ease
            </p>

            {/* Hero Search */}
            <div className="max-w-3xl mx-auto">
              <SearchBar
                placeholder="Search for services, chefs, venues, or locations..."
                onFilterClick={() => navigate('/search')}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container-max space-y-16 lg:space-y-24 py-12 lg:py-16">
        {/* Categories */}
        <section>
          <div className="text-center mb-10 lg:mb-12">
            <h2 className="text-3xl lg:text-5xl font-display font-bold text-gray-900 mb-3">Browse by Category</h2>
            <p className="text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
              Curated services to match your lifestyle needs
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
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
          <div className="text-center mb-10 lg:mb-12">
            <h2 className="text-3xl lg:text-5xl font-display font-bold text-gray-900 mb-3">Popular Near You</h2>
            <p className="text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
              Highly-rated services available in your area
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
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
          <div className="text-center mb-10 lg:mb-12">
            <h2 className="text-3xl lg:text-5xl font-display font-bold text-gray-900 mb-3">Featured Services</h2>
            <p className="text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
              Premium selections handpicked for quality and excellence
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
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