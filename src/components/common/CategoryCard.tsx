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
        'flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 min-w-[100px] h-24',
        isSelected
          ? 'border-secondary-500 bg-secondary-50 text-secondary-700'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm text-gray-700'
      )}
    >
      <div className="text-2xl mb-1">{category.icon}</div>
      <span className="text-xs font-medium text-center leading-tight whitespace-pre-line">
        {category.name}
      </span>
    </button>
  )
}

export default CategoryCard