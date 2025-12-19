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
    <div className="min-h-screen bg-luxury-cream pb-20 lg:pb-0 relative">
      {/* Mobile & Desktop Header */}
      <header className={`relative bg-white/90 backdrop-blur-2xl border-b border-white/50 transition-all duration-500 z-50 ${
        scrollPastServices ? 'sticky top-0 shadow-luxury-hover' : 'relative shadow-luxury'
      }`}>
        {/* Premium gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-50/30 via-white/50 to-secondary-50/30 pointer-events-none" />

        <div className="container-max py-4 lg:py-6 relative z-10">
          <div className="flex items-center justify-between">
            {/* Logo - Icon only on mobile */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/home')}>
              <div className="relative p-2 lg:p-2.5 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 group-hover:from-primary-600 group-hover:to-secondary-600 transition-all duration-500 shadow-lg group-hover:shadow-xl transform group-hover:scale-105">
                <img src="/logo.svg" alt="MetroWayz" className="w-7 h-7 lg:w-9 lg:h-9 brightness-0 invert" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
              </div>
              <div className="hidden lg:block">
                <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-dark-900 to-dark-700 bg-clip-text text-transparent tracking-tight">
                  MetroWayz
                </h1>
                <p className="text-xs bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent font-semibold">
                  Premium Lifestyle Services
                </p>
              </div>
            </div>

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
                className="text-sm font-semibold text-dark-700 hover:text-primary-600 transition-all duration-300 relative group py-2"
              >
                Services
                <span className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 group-hover:w-full transition-all duration-500 rounded-full shadow-glow"></span>
              </button>
              <button
                onClick={() => {
                  console.log('Desktop Vendor button clicked')
                  navigate('/vendor')
                }}
                className="text-sm font-semibold text-dark-700 hover:text-primary-600 transition-all duration-300 relative group py-2"
              >
                Become a Vendor
                <span className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 group-hover:w-full transition-all duration-500 rounded-full shadow-glow"></span>
              </button>
              <button className="text-sm font-semibold text-dark-700 hover:text-primary-600 transition-all duration-300 relative group py-2">
                Help
                <span className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 group-hover:w-full transition-all duration-500 rounded-full shadow-glow"></span>
              </button>
            </nav>

            {/* Desktop Right Actions - Notification only on desktop */}
            <div className="hidden lg:flex items-center gap-4">
              <button
                onClick={() => {/* Navigate to notifications */}}
                className="relative p-3 bg-white/50 hover:bg-gradient-to-br hover:from-primary-50 hover:to-secondary-50 rounded-2xl transition-all duration-500 group shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Bell className="w-5 h-5 text-dark-600 group-hover:text-primary-600 transition-colors" />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full ring-2 ring-white animate-pulse"></span>
              </button>
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    console.log('Desktop Logout clicked')
                    logout()
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => {
                    console.log('Desktop Login button clicked')
                    navigate('/')
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-16 lg:py-28 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary-400/20 to-secondary-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-secondary-400/20 to-accent-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="container-max relative z-10">
          <div className="max-w-5xl mx-auto text-center mb-12">
            {/* Premium badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-white/80 backdrop-blur-md rounded-full shadow-luxury border border-primary-100/50 animate-fade-in">
              <span className="w-2 h-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Premium Lifestyle Services
              </span>
            </div>

            <h2 className="text-5xl lg:text-7xl font-display font-bold mb-6 lg:mb-8 animate-slide-up">
              <span className="bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 bg-clip-text text-transparent">
                Discover Premium
              </span>
              <span className="block mt-2 bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent">
                Lifestyle Services
              </span>
            </h2>

            <p className="text-lg lg:text-2xl text-dark-600 mb-10 lg:mb-14 max-w-3xl mx-auto leading-relaxed font-light animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Book private chefs, luxury accommodations, entertainment, and professional services with ease
            </p>

            {/* Hero Search */}
            <div className="max-w-3xl mx-auto animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <SearchBar
                placeholder="Search for services, chefs, venues, or locations..."
                onFilterClick={() => navigate('/search')}
              />
            </div>
          </div>

          {/* Stats or trust indicators */}
          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto mt-16 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="text-center p-6 bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 shadow-luxury hover:shadow-luxury-hover transition-all duration-300 hover:-translate-y-1">
              <div className="text-3xl lg:text-4xl font-display font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
                500+
              </div>
              <div className="text-sm lg:text-base text-dark-600 font-medium">Premium Services</div>
            </div>
            <div className="text-center p-6 bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 shadow-luxury hover:shadow-luxury-hover transition-all duration-300 hover:-translate-y-1">
              <div className="text-3xl lg:text-4xl font-display font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
                50K+
              </div>
              <div className="text-sm lg:text-base text-dark-600 font-medium">Happy Customers</div>
            </div>
            <div className="text-center p-6 bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 shadow-luxury hover:shadow-luxury-hover transition-all duration-300 hover:-translate-y-1">
              <div className="text-3xl lg:text-4xl font-display font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
                4.9★
              </div>
              <div className="text-sm lg:text-base text-dark-600 font-medium">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-max space-y-20 lg:space-y-32 py-16 lg:py-24">
        {/* Categories */}
        <section className="relative">
          {/* Background gradient orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary-100/40 via-secondary-100/40 to-accent-100/40 rounded-full blur-3xl opacity-50 pointer-events-none" />

          <div className="relative z-10">
            <div className="text-center mb-12 lg:mb-16">
              <div className="inline-block mb-4">
                <span className="text-sm font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent uppercase tracking-wider">
                  Explore Categories
                </span>
              </div>
              <h2 className="text-4xl lg:text-6xl font-display font-bold mb-4 lg:mb-6">
                <span className="bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 bg-clip-text text-transparent">
                  Browse by Category
                </span>
              </h2>
              <p className="text-base lg:text-xl text-dark-600 max-w-2xl mx-auto leading-relaxed">
                Curated services to match your lifestyle needs
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
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
          </div>
        </section>

        {/* Promo Banners */}
        <section>
          <div className="relative h-100 lg:h-[500px] rounded-3xl overflow-hidden shadow-luxury-hover border border-white/20">
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
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                <div className="absolute bottom-8 left-8 lg:left-12 text-white max-w-xl">
                  <h3 className="text-2xl lg:text-4xl font-display font-bold mb-2">{banner.title}</h3>
                  <p className="text-base lg:text-lg opacity-90 mb-6">{banner.subtitle}</p>
                  <button className="px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                    Explore Now
                  </button>
                </div>
              </div>
            ))}

            {/* Dots indicator */}
            <div className="absolute bottom-8 right-8 lg:right-12 flex space-x-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBannerIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentBannerIndex ? 'bg-white w-8' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Explore Nearby */}
        <section className="relative">
          {/* Background gradient */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-secondary-100/30 to-accent-100/30 rounded-full blur-3xl opacity-60 pointer-events-none" />

          <div className="relative z-10">
            <div className="text-center mb-12 lg:mb-16">
              <div className="inline-block mb-4">
                <span className="text-sm font-bold bg-gradient-to-r from-secondary-600 to-accent-600 bg-clip-text text-transparent uppercase tracking-wider">
                  Discover Nearby
                </span>
              </div>
              <h2 className="text-4xl lg:text-6xl font-display font-bold mb-4 lg:mb-6">
                <span className="bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 bg-clip-text text-transparent">
                  Popular Near You
                </span>
              </h2>
              <p className="text-base lg:text-xl text-dark-600 max-w-2xl mx-auto leading-relaxed">
                Highly-rated services available in your area
              </p>
            </div>
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
                  className="group relative h-48 lg:h-56 rounded-2xl overflow-hidden shadow-luxury cursor-pointer hover:shadow-luxury-hover transition-all duration-500 transform hover:-translate-y-2 border border-white/20"
                >
                  <img
                    src={imageUrl}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="font-display font-bold text-sm lg:text-base truncate mb-1.5 drop-shadow-lg">
                      {service.title}
                    </h3>
                    <p className="text-xs opacity-90 truncate mb-3 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {service.location}
                    </p>
                    <div className="text-base lg:text-lg font-display font-bold drop-shadow-lg">
                      ₦{service.price.toLocaleString()}
                      <span className="text-xs font-normal opacity-90"> {getPriceUnitDisplay(service)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Featured Services */}
        <section className="relative">
          {/* Background gradient */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-primary-100/40 via-accent-100/40 to-secondary-100/40 rounded-full blur-3xl opacity-50 pointer-events-none" />

          <div className="relative z-10">
            <div className="text-center mb-12 lg:mb-16">
              <div className="inline-block mb-4">
                <span className="text-sm font-bold bg-gradient-to-r from-accent-600 to-primary-600 bg-clip-text text-transparent uppercase tracking-wider">
                  Handpicked Selection
                </span>
              </div>
              <h2 className="text-4xl lg:text-6xl font-display font-bold mb-4 lg:mb-6">
                <span className="bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 bg-clip-text text-transparent">
                  Featured Services
                </span>
              </h2>
              <p className="text-base lg:text-xl text-dark-600 max-w-2xl mx-auto leading-relaxed">
                Premium selections handpicked for quality and excellence
              </p>
            </div>
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

        {/* More for You */}
        <section ref={moreForYouRef} className="relative">
          {/* Background gradient */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-100/30 to-secondary-100/30 rounded-full blur-3xl opacity-50 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8 lg:mb-10">
              <div>
                <span className="text-sm font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent uppercase tracking-wider mb-2 block">
                  Personalized
                </span>
                <h2 className="text-3xl lg:text-4xl font-display font-bold bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 bg-clip-text text-transparent">
                  More for you
                </h2>
              </div>
              <button
                onClick={() => navigate('/search')}
                className="px-6 py-3 bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                See all
              </button>
            </div>
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
                    className="group bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-luxury cursor-pointer hover:shadow-luxury-hover transition-all duration-500 transform hover:-translate-y-2 border border-white/40"
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={service.title}
                        className="w-full h-36 lg:h-40 object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    <div className="p-3 lg:p-4">
                      <h3 className="font-display font-bold text-sm lg:text-base text-gray-900 truncate mb-1.5 group-hover:text-primary-600 transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-xs text-gray-500 truncate mb-2.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-primary-400" />
                        {service.location}
                      </p>
                      <div className="text-base lg:text-lg font-display font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                        ₦{service.price.toLocaleString()}
                        <span className="text-xs font-normal text-gray-500"> {getPriceUnitDisplay(service)}</span>
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