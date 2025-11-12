import React from 'react'
import { Category } from '../../types'
import { cn } from '../../utils/cn'

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
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center p-5 rounded-2xl transition-all duration-300 min-w-[110px] h-28 transform hover:scale-105 shadow-card',
        isSelected
          ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg scale-105'
          : 'bg-white hover:shadow-card-hover text-gray-700 hover:bg-gray-50'
      )}
    >
      <div className={cn(
        "text-3xl mb-2 transition-transform duration-300",
        isSelected ? "scale-110" : "group-hover:scale-110"
      )}>
        {category.icon}
      </div>
      <span className={cn(
        "text-xs font-semibold text-center leading-tight whitespace-pre-line",
        isSelected ? "text-white" : "text-gray-700"
      )}>
        {category.name}
      </span>
    </button>
  )
}

export default CategoryCard