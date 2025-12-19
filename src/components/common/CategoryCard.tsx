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
        'group flex flex-col items-center justify-center gap-4 lg:gap-5 px-6 py-8 lg:px-8 lg:py-10 rounded-xl transition-all duration-300 w-full border-2',
        isSelected
          ? 'bg-primary-500 border-primary-500 text-white shadow-lg'
          : 'bg-white border-gray-200 hover:border-primary-500 text-gray-700 hover:shadow-md'
      )}
    >
      <div className={cn(
        "w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center transition-all duration-300",
        isSelected
          ? "bg-white/20"
          : "bg-gray-50 group-hover:bg-primary-50"
      )}>
        <Icon
          className={cn(
            "w-8 h-8 lg:w-10 lg:h-10 transition-colors duration-300",
            isSelected ? "text-white" : "text-primary-500"
          )}
          strokeWidth={2}
        />
      </div>
      <span className={cn(
        "text-sm lg:text-base font-semibold text-center",
        isSelected ? "text-white" : "text-gray-900 group-hover:text-primary-500"
      )}>
        {category.name}
      </span>
    </button>
  )
}

export default CategoryCard