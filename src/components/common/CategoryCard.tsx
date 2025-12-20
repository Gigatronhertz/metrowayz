import React from 'react'
import { Category } from '../../types'
import { cn } from '../../utils/cn'
import { ChefHat, Music, Home, Briefcase, LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  ChefHat,
  Music,
  Home,
  Briefcase,
}

interface CategoryCardProps {
  category: Category
  isSelected?: boolean
  onClick?: () => void
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isSelected = false,
  onClick
}) => {
  const Icon = iconMap[category.icon] || Home

  const getDescription = (categoryId: string) => {
    switch (categoryId) {
      case 'private-chefs':
        return 'Professional chefs for your events and daily meals'
      case 'accommodation':
        return 'Luxury short-stay homes and apartments'
      case 'entertainment':
        return 'Local events, music, and entertainment experiences'
      case 'professional':
        return 'Expert services for all your professional needs'
      default:
        return 'Premium lifestyle services'
    }
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex flex-col items-center justify-center gap-3 px-4 py-6 lg:px-6 lg:py-8 rounded-xl transition-all duration-300 w-full bg-white shadow-md hover:shadow-lg border border-gray-100',
        isSelected && 'ring-2 ring-primary-500 shadow-lg'
      )}
    >
      <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center transition-all duration-300 bg-primary-50 group-hover:bg-primary-100">
        <Icon
          className="w-6 h-6 lg:w-8 lg:h-8 text-primary-500"
          strokeWidth={2}
        />
      </div>
      <div className="text-center">
        <h3 className="text-sm lg:text-base font-bold text-gray-900 mb-1">
          {category.name}
        </h3>
        <p className="text-xs lg:text-sm text-gray-600 leading-relaxed">
          {getDescription(category.id)}
        </p>
      </div>
    </button>
  )
}

export default CategoryCard