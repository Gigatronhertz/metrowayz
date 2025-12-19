import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Calendar, MapPin } from 'lucide-react'
import { categories, banners } from '../data/mockData'
import { serviceAPI, eventsAPI } from '../services/api'
import { formatPriceUnit } from '../utils/format'
import { useAuth } from '../hooks/useAuth'
import BottomNavigation from '../components/layout/BottomNavigation'
import CategoryCard from '../components/common/CategoryCard'
import ServiceCard from '../components/common/ServiceCard'
import SearchBar from '../components/common/SearchBar'
import { format } from 'date-fns'

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
  isChefService?: boolean
}

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useAuth()
  const moreForYouRef = useRef<HTMLDivElement>(null)
  const [selectedCategory, setSelectedCategory] = useState('accommodation')
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [services, setServices] = useState<Service[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scrollPastServices, setScrollPastServices] = useState(false)

  const getPriceUnitDisplay = (service: Service) => {
    return service.isChefService ? 'per service' : formatPriceUnit(service.priceUnit, 'short');
  };

  // Auto-scroll banners
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      // Detect if scrolled past services section (approximately 800px down)
      setScrollPastServices(scrollPosition > 800)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
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

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsList = await eventsAPI.getPublicEvents({
          limit: 20,
          status: 'active'
        })
        console.log('📸 Fetched events:', eventsList)
        console.log('📸 First event image:', eventsList[0]?.image)
        console.log('📸 First event images array:', eventsList[0]?.images)
        setEvents(eventsList || [])
      } catch (error) {
        console.error('Error fetching events:', error)
        setEvents([])
      }
    }

    fetchEvents()
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
    <div className="min-h-screen bg-white pb-20 lg:pb-0 relative">
      {/* Mobile & Desktop Header */}
      <header className={`bg-white border-b border-gray-100 transition-all duration-500 z-50 ${
        scrollPastServices ? 'sticky top-0 shadow-md' : 'relative'
      }`}>
        <div className={`container-max transition-all duration-500 ${scrollPastServices ? 'py-3' : 'py-5 lg:py-6'}`}>
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/home')}>
              <div className={`rounded-xl bg-primary-500 flex items-center justify-center group-hover:bg-primary-600 transition-all duration-500 ${
                scrollPastServices ? 'w-9 h-9' : 'w-10 h-10 lg:w-12 lg:h-12'
              }`}>
                <img src="/logo.svg" alt="MetroWayz" className={`brightness-0 invert transition-all duration-500 ${
                  scrollPastServices ? 'w-5 h-5' : 'w-6 h-6 lg:w-7 lg:h-7'
                }`} />
              </div>
              <div className={`hidden lg:block transition-all duration-500 ${scrollPastServices ? 'opacity-0 w-0' : 'opacity-100'}`}>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  MetroWayz
                </h1>
                <p className="text-xs text-gray-600 font-medium">
                  Premium Lifestyle Services
                </p>
              </div>
            </div>

            {/* Sticky Search Bar (Desktop Only) */}
            {scrollPastServices && (
              <div className="hidden lg:block flex-1 max-w-xl mx-8 animate-fade-in">
                <SearchBar
                  placeholder="Search services..."
                  onFilterClick={() => navigate('/search')}
                />
              </div>
            )}

            {/* Mobile Navigation - Shows when scrolled past services */}
            <nav className="flex lg:hidden items-center gap-3">
              {scrollPastServices && (
                <button
                  onClick={() => navigate('/search')}
                  className="text-sm font-semibold text-primary-600 animate-fade-in"
                >
                  Services
                </button>
              )}
              <button
                onClick={() => {
                  console.log('Vendor button clicked')
                  navigate('/vendor')
                }}
                className="text-xs font-medium text-dark-700 hover:text-primary-600 transition-colors"
              >
                Vendor
              </button>
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    console.log('Logout clicked')
                    logout()
                  }}
                  className="text-xs font-medium px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all duration-300 shadow-md"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => {
                    console.log('Login button clicked')
                    navigate('/')
                  }}
                  className="text-xs font-semibold px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl transition-all duration-300 shadow-md"
                >
                  Login
                </button>
              )}
            </nav>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <button
                onClick={() => navigate('/search')}
                className="text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors"
              >
                Services
              </button>
              <button
                onClick={() => {
                  console.log('Desktop Vendor button clicked')
                  navigate('/vendor')
                }}
                className="text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors"
              >
                Become a Vendor
              </button>
              <button className="text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors">
                Help
              </button>
            </nav>

            {/* Desktop Right Actions */}
            <div className="hidden lg:flex items-center gap-4">
              <button
                onClick={() => {/* Navigate to notifications */}}
                className="relative p-2.5 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-700" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full"></span>
              </button>
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    console.log('Desktop Logout clicked')
                    logout()
                  }}
                  className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => {
                    console.log('Desktop Login button clicked')
                    navigate('/')
                  }}
                  className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gray-50 py-16 lg:py-24 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80"
            alt="Luxury background"
            className="w-full h-full object-cover opacity-10"
          />
        </div>

        <div className="container-max relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-display font-semibold text-gray-900 mb-4 lg:mb-5 tracking-tight">
              Premium Lifestyle
              <span className="block text-primary-500 mt-1">Services</span>
            </h1>

            <p className="text-base lg:text-lg text-gray-600 mb-8 lg:mb-10 max-w-2xl mx-auto leading-relaxed">
              Book private chefs, luxury accommodations, entertainment, and professional services with ease
            </p>

            {/* Hero Search */}
            <div className="max-w-2xl mx-auto mb-12 lg:mb-14">
              <SearchBar
                placeholder="Search for services, chefs, venues, or locations..."
                onFilterClick={() => navigate('/search')}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                  500+
                </div>
                <div className="text-xs lg:text-sm text-gray-600">Premium Services</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                  50K+
                </div>
                <div className="text-xs lg:text-sm text-gray-600">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                  4.9★
                </div>
                <div className="text-xs lg:text-sm text-gray-600">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-white py-16 lg:py-20">
        {/* Categories */}
        <section className="container-max">
          <div className="text-center mb-8 lg:mb-10">
            <h2 className="text-2xl lg:text-3xl font-display font-semibold text-gray-900 mb-2">
              Browse by Category
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Curated services to match your lifestyle needs
            </p>
          </div>

          <div className="grid grid-cols-2 lg:flex lg:justify-center lg:items-center lg:gap-4 gap-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                isSelected={selectedCategory === category.id}
                onClick={() => {
                  setSelectedCategory(category.id)
                  setTimeout(() => {
                    moreForYouRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }, 100)
                }}
              />
            ))}
          </div>
        </section>

        {/* Promotional Carousel */}
        <section className="container-max mt-16 lg:mt-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-display font-semibold text-gray-900 mb-2">
              Special Offers & Events
            </h2>
            <p className="text-sm text-gray-600">
              Don't miss out on our exclusive deals
            </p>
          </div>

          <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden">
            {banners.map((banner, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  index === currentBannerIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10 text-white">
                  <div className="max-w-2xl">
                    <h3 className="text-2xl lg:text-4xl font-display font-semibold mb-2 lg:mb-3">{banner.title}</h3>
                    <p className="text-base lg:text-lg mb-4 lg:mb-6 opacity-95">{banner.subtitle}</p>
                    <button className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-colors">
                      Explore Now
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Navigation Dots */}
            <div className="absolute bottom-8 right-8 flex gap-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBannerIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentBannerIndex
                      ? 'bg-white w-8'
                      : 'bg-white/50 w-2 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="bg-gray-50 py-16 lg:py-20">
        {/* Explore Nearby */}
        <section className="container-max">
          <div className="text-center mb-8 lg:mb-10">
            <h2 className="text-2xl lg:text-3xl font-display font-semibold text-gray-900 mb-2">
              Popular Near You
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
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
                  className="group relative h-64 lg:h-72 rounded-xl overflow-hidden shadow-sm hover:shadow-lg cursor-pointer transition-all duration-300 border border-gray-100"
                >
                  <img
                    src={imageUrl}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="font-semibold text-sm lg:text-base truncate mb-1.5">
                      {service.title}
                    </h3>
                    <p className="text-xs opacity-90 truncate mb-2 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {service.location}
                    </p>
                    <div className="text-base lg:text-lg font-bold">
                      ₦{service.price.toLocaleString()}
                      <span className="text-xs font-normal opacity-90"> {getPriceUnitDisplay(service)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>

      <div className="bg-white py-16 lg:py-20">
        {/* Featured Services */}
        <section className="container-max">
          <div className="text-center mb-8 lg:mb-10">
            <h2 className="text-2xl lg:text-3xl font-display font-semibold text-gray-900 mb-2">
              Featured Services
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
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

        {/* Upcoming Events - Show when Entertainment is selected */}
        {selectedCategory === 'entertainment' && events.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Upcoming Events</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div
                  key={event._id}
                  onClick={() => navigate(`/event/${event._id}`)}
                  className="bg-white rounded-xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  {/* Event Image */}
                  <div className="relative h-48 bg-gray-200">
                    {(event.image || event.images?.[0]?.url) ? (
                      <>
                        <img
                          src={event.image || event.images[0].url}
                          alt={event.title}
                          className="w-full h-full object-cover"
                          onError={() => {
                            console.error('📸 Image failed to load:', event.image || event.images[0].url);
                            console.error('📸 Event data:', event);
                          }}
                        />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                    {event.featured && (
                      <span className="absolute top-3 right-3 px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                        ⭐ Featured
                      </span>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{event.title}</h3>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        {event.category || 'Event'}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar size={16} className="mr-2 flex-shrink-0" />
                        {format(new Date(event.eventDate), 'MMM dd, yyyy')} at {event.eventTime}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin size={16} className="mr-2 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500">Ticket Price</p>
                        <p className="font-bold text-lg text-primary-500">
                          {event.ticketPrice === 0 ? 'Free' : `₦${event.ticketPrice.toLocaleString()}`}
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-semibold">
                        View Event
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      <div className="bg-gray-50 py-16 lg:py-20">
        {/* More for You */}
        <section ref={moreForYouRef} className="container-max">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-display font-semibold text-gray-900">
                More for you
              </h2>
              <p className="text-sm text-gray-600 mt-1">Personalized recommendations</p>
            </div>
            <button
              onClick={() => navigate('/search')}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
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
                    className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg cursor-pointer transition-all duration-300 border border-gray-100"
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={service.title}
                        className="w-full h-40 lg:h-44 object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3.5 lg:p-4">
                      <h3 className="font-semibold text-xs lg:text-sm text-gray-900 truncate mb-1.5">
                        {service.title}
                      </h3>
                      <p className="text-[10px] text-gray-500 truncate mb-2.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {service.location}
                      </p>
                      <div className="text-base lg:text-lg font-bold text-gray-900">
                        ₦{service.price.toLocaleString()}
                        <span className="text-[10px] font-normal text-gray-500"> {getPriceUnitDisplay(service)}</span>
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