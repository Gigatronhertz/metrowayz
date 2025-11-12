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
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1 relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <Search className="w-6 h-6 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full pl-14 pr-5 py-4 text-base bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm hover:shadow-md placeholder-gray-400"
        />
      </div>

      {onFilterClick && (
        <button
          onClick={onFilterClick}
          className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
        >
          <SlidersHorizontal className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}

export default SearchBar