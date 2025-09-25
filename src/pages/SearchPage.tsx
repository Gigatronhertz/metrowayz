import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Grid, List } from 'lucide-react'
import { services, categories } from '../data/mockData'
import { SearchFilters } from '../types'
import Header from '../components/layout/Header'
import BottomNavigation from '../components/layout/BottomNavigation'
import SearchBar from '../components/common/SearchBar'
import ServiceCard from '../components/common/ServiceCard'

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({})

  const filteredServices = useMemo(() => {
    let filtered = services

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => {
        switch (selectedCategory) {
          case 'cars':
            return service.category.toLowerCase().includes('car')
          case 'rentals':
            return service.category.toLowerCase().includes('short-let')
          case 'apartments':
            return service.category.toLowerCase().includes('serviced')
          case 'food':
            return service.category.toLowerCase().includes('food')
          case 'chefs':
            return service.category.toLowerCase().includes('chef')
          case 'entertainment':
            return service.category.toLowerCase().includes('entertainment')
          default:
            return true
        }
      })
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(service =>
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply additional filters
    if (filters.priceRange) {
      filtered = filtered.filter(service =>
        service.price >= filters.priceRange![0] && service.price <= filters.priceRange![1]
      )
    }

    if (filters.rating) {
      filtered = filtered.filter(service => service.rating >= filters.rating!)
    }

    // Sort results
    if (filters.sortBy) {
      filtered = [...filtered].sort((a, b) => {
        switch (filters.sortBy) {
          case 'price':
            return a.price - b.price
          case 'rating':
            return b.rating - a.rating
          case 'newest':
            return 0 // Would sort by creation date in real app
          default:
            return 0
        }
      })
    }

    return filtered
  }, [selectedCategory, searchQuery, filters])

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setSearchParams({ category: categoryId })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header 
        title="Search Services" 
        showBack 
        showNotifications 
      />

      <div className="container-padding py-4 space-y-4">
        {/* Search Bar */}
        <SearchBar
          placeholder="Search services..."
          value={searchQuery}
          onChange={setSearchQuery}
          onFilterClick={() => setShowFilters(true)}
        />

        {/* Categories */}
        <div className="flex space-x-3 overflow-x-auto pb-2">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              {category.name.replace('\n', ' ')}
            </button>
          ))}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            {filteredServices.length} services found
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${
                viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Results */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                variant={viewMode === 'grid' ? 'compact' : 'default'}
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