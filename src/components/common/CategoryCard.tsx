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

  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex flex-col items-center justify-center gap-3 px-4 py-6 rounded-xl transition-all duration-300 w-full aspect-square border-2',
        isSelected
          ? 'bg-primary-500 border-primary-500 text-white shadow-lg'
          : 'bg-white border-gray-200 hover:border-primary-500 text-gray-700 hover:shadow-md'
      )}
    >
      <div className={cn(
        "w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center transition-all duration-300",
        isSelected
          ? "bg-white/20"
          : "bg-gray-50 group-hover:bg-primary-50"
      )}>
        <Icon
          className={cn(
            "w-6 h-6 lg:w-7 lg:h-7 transition-colors duration-300",
            isSelected ? "text-white" : "text-primary-500"
          )}
          strokeWidth={2}
        />
      </div>
      <span className={cn(
        "text-xs lg:text-sm font-semibold text-center leading-tight px-1",
        isSelected ? "text-white" : "text-gray-900 group-hover:text-primary-500"
      )}>
        {category.name}
      </span>
    </button>
  )
}

export default CategoryCard