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
        'group relative flex flex-col items-center justify-center gap-3 lg:gap-4 px-4 py-6 lg:px-6 lg:py-8 rounded-2xl lg:rounded-3xl transition-all duration-500 w-full aspect-square border-2 overflow-hidden',
        isSelected
          ? 'bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 border-primary-400/50 text-white shadow-luxury-hover scale-105'
          : 'bg-white/80 backdrop-blur-sm border-gray-200/50 hover:border-primary-300/50 text-gray-700 hover:bg-gradient-to-br hover:from-primary-50 hover:to-secondary-50 hover:shadow-luxury hover:scale-102 transform'
      )}
    >
      {/* Glassmorphism overlay on hover */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 backdrop-blur-sm opacity-0 transition-opacity duration-500",
        isSelected ? "opacity-100" : "group-hover:opacity-100"
      )} />

      {/* Animated gradient orb */}
      <div className={cn(
        "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl transition-opacity duration-500",
        isSelected
          ? "bg-gradient-to-br from-white/30 to-accent-400/30 opacity-100"
          : "bg-gradient-to-br from-primary-200/50 to-secondary-200/50 opacity-0 group-hover:opacity-100"
      )} />

      <div className="relative z-10 flex flex-col items-center gap-3 lg:gap-4">
        <div className={cn(
          "p-4 lg:p-5 rounded-2xl lg:rounded-3xl transition-all duration-500 shadow-lg group-hover:shadow-xl transform group-hover:scale-110",
          isSelected
            ? "bg-white/20 backdrop-blur-md ring-2 ring-white/30"
            : "bg-gradient-to-br from-primary-50 to-secondary-50 group-hover:from-primary-100 group-hover:to-secondary-100"
        )}>
          <Icon
            className={cn(
              "w-8 h-8 lg:w-10 lg:h-10 transition-all duration-500",
              isSelected ? "text-white drop-shadow-lg" : "text-primary-600 group-hover:text-primary-700"
            )}
            strokeWidth={2}
          />
        </div>
        <span className={cn(
          "text-xs lg:text-sm font-bold text-center leading-tight transition-all duration-300",
          isSelected ? "text-white drop-shadow-sm" : "text-gray-800 group-hover:text-primary-700"
        )}>
          {category.name}
        </span>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute bottom-2 right-2 w-3 h-3 bg-white rounded-full shadow-lg animate-pulse" />
      )}
    </button>
  )
}

export default CategoryCard