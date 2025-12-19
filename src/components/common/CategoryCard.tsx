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
        'group flex flex-col items-center justify-center gap-2 px-3 py-4 lg:px-4 lg:py-5 rounded-lg transition-all duration-300 w-full aspect-square lg:aspect-auto border-2',
        isSelected
          ? 'bg-primary-500 border-primary-500 text-white shadow-md'
          : 'bg-white border-gray-200 hover:border-primary-500 text-gray-700 hover:shadow-sm'
      )}
    >
      <div className={cn(
        "w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all duration-300",
        isSelected
          ? "bg-white/20"
          : "bg-gray-50 group-hover:bg-primary-50"
      )}>
        <Icon
          className={cn(
            "w-5 h-5 lg:w-6 lg:h-6 transition-colors duration-300",
            isSelected ? "text-white" : "text-primary-500"
          )}
          strokeWidth={2}
        />
      </div>
      <span className={cn(
        "text-[10px] lg:text-xs font-semibold text-center leading-tight",
        isSelected ? "text-white" : "text-gray-900 group-hover:text-primary-500"
      )}>
        {category.name}
      </span>
    </button>
  )
}

export default CategoryCard