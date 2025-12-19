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
        'flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all duration-300 w-full aspect-square border-2',
        isSelected
          ? 'bg-primary-500 border-primary-600 text-white shadow-lg scale-105'
          : 'bg-white border-gray-200 hover:border-primary-300 text-gray-700 hover:bg-primary-50 hover:shadow-md'
      )}
    >
      <div className={cn(
        "p-0.5 rounded-full transition-all duration-300",
        isSelected
          ? "bg-white/20"
          : "bg-primary-50"
      )}>
        <Icon
          className={cn(
            "w-2.5 h-2.5 transition-colors",
            isSelected ? "text-white" : "text-primary-600"
          )}
          strokeWidth={1.5}
        />
      </div>
      <span className={cn(
        "text-[10px] font-semibold text-center leading-tight",
        isSelected ? "text-white" : "text-gray-800"
      )}>
        {category.name}
      </span>
    </button>
  )
}

export default CategoryCard