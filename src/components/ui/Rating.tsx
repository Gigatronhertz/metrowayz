import React from 'react'
import { Star } from 'lucide-react'
import { cn } from '../../utils/cn'

interface RatingProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
  onChange?: (value: number) => void
  className?: string
}

const Rating: React.FC<RatingProps> = ({
  value,
  max = 5,
  size = 'md',
  readonly = true,
  onChange,
  className
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating)
    }
  }

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1
        const isFilled = starValue <= value
        const isHalfFilled = starValue - 0.5 <= value && starValue > value

        return (
          <button
            key={index}
            type="button"
            className={cn(
              'focus:outline-none',
              !readonly && 'hover:scale-110 transition-transform',
              readonly && 'cursor-default'
            )}
            onClick={() => handleClick(starValue)}
            disabled={readonly}
          >
            <Star
              className={cn(
                sizes[size],
                isFilled || isHalfFilled
                  ? 'fill-accent-500 text-accent-500'
                  : 'text-gray-300'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

export default Rating