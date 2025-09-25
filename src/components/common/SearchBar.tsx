import React from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { cn } from '../../utils/cn'

interface SearchBarProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onFilterClick?: () => void
  className?: string
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search services...',
  value,
  onChange,
  onFilterClick,
  className
}) => {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="flex-1 relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
      
      {onFilterClick && (
        <button
          onClick={onFilterClick}
          className="p-3 bg-primary-500 text-white rounded-2xl hover:bg-primary-600 transition-colors"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

export default SearchBar