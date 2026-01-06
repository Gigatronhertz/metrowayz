import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Grid, List, Map } from 'lucide-react'
import { categories } from '../data/mockData'
import { serviceAPI } from '../services/api'
import { SearchFilters } from '../types'
import Header from '../components/layout/Header'
import BottomNavigation from '../components/layout/BottomNavigation'
import SearchBar from '../components/common/SearchBar'
import ServiceCard from '../components/common/ServiceCard'
import ServicesMap from '../components/common/ServicesMap'

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

// Map category IDs to actual category names used in the database
const getCategoryName = (categoryId: string): string | undefined => {
  const categoryMap: { [key: string]: string } = {
    'accommodation': 'Accommodation',
    'private-chefs': 'Private Chefs',
    'entertainment': 'Entertainment',
  }
  return categoryMap[categoryId]
}

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'map'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)

  // Scroll detection for sticky search
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true)
        const categoryName = selectedCategory !== 'all' ? getCategoryName(selectedCategory) : undefined
        const response = await serviceAPI.getPublicServices({
          search: searchQuery || undefined,
          category: categoryName,
          minPrice: filters.priceRange?.[0],
          maxPrice: filters.priceRange?.[1],
          sortBy: filters.sortBy || 'createdAt',
          sortOrder: filters.sortBy === 'price' ? 'asc' : 'desc',
          limit: 50
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
  }, [searchQuery, selectedCategory, filters])

  const filteredServices = useMemo(() => {
    let filtered = services

    // Additional client-side filtering for rating
    if (filters.rating) {
      filtered = filtered.filter(service => (service.rating || 0) >= filters.rating!)
    }

    return filtered
  }, [services, filters.rating])

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setSearchParams({ category: categoryId })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      <Header
        title="Search Services"
        showBack
        showNotifications
      />

      {/* Sticky Search & Categories */}
      <div className={`bg-white transition-all duration-500 z-40 ${
        isScrolled ? 'sticky top-0 shadow-md' : 'relative'
      }`}>
        <div className={`container-padding transition-all duration-500 ${
          isScrolled ? 'py-3' : 'py-4'
        }`}>
          {/* Search Bar */}
          <div className="mb-3">
            <SearchBar
              placeholder="Search services..."
              value={searchQuery}
              onChange={setSearchQuery}
              onFilterClick={() => setShowFilters(true)}
            />
          </div>

          {/* Categories - Hidden on mobile when sticky */}
          <div className={`flex space-x-2 overflow-x-auto pb-2 scrollbar-hide ${
            isScrolled ? 'hidden lg:flex' : 'flex'
          }`}>
            <button
              onClick={() => handleCategoryChange('all')}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-500'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-semibold transition-all ${
                  selectedCategory === category.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-500'
                }`}
              >
                {category.name.replace('\n', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-padding py-4 space-y-4">

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 font-medium">
            {filteredServices.length} services found
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'map' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Map className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading services...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === 'map' ? (
          <ServicesMap services={filteredServices} />
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6' : 'space-y-4'}>
            {filteredServices.map((service) => (
              <ServiceCard
                key={service._id}
                service={{
                  ...service,
                  id: service._id,
                  images: service.images.map(img => typeof img === 'string' ? img : img.url)
                } as any}
                variant={viewMode === 'list' ? 'compact' : 'default'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Filters</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Price Range</h3>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="5000"
                    className="flex-1"
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      priceRange: [0, parseInt(e.target.value)]
                    }))}
                  />
                </div>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Minimum Rating</h3>
                <div className="flex space-x-2">
                  {[3, 4, 4.5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFilters(prev => ({ ...prev, rating }))}
                      className={`px-3 py-2 rounded-lg border ${
                        filters.rating === rating
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200'
                      }`}
                    >
                      {rating}+ ⭐
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Sort By</h3>
                <div className="space-y-2">
                  {[
                    { value: 'price', label: 'Price (Low to High)' },
                    { value: 'rating', label: 'Highest Rated' },
                    { value: 'newest', label: 'Newest First' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilters(prev => ({ ...prev, sortBy: option.value as any }))}
                      className={`w-full text-left p-3 rounded-lg border ${
                        filters.sortBy === option.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setFilters({})
                    setShowFilters(false)
                  }}
                  className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-semibold"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  )
}

export default SearchPage