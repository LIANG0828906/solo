import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value?: number
  onChange?: (rating: number) => void
  readOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeConfig = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

export default function StarRating({
  value = 0,
  onChange,
  readOnly = false,
  size = 'md',
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0)
  const displayValue = readOnly ? value : hoverValue || value

  const handleClick = (rating: number) => {
    if (!readOnly && onChange) {
      onChange(rating)
    }
  }

  const handleMouseEnter = (rating: number) => {
    if (!readOnly) {
      setHoverValue(rating)
    }
  }

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverValue(0)
    }
  }

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((rating) => {
        const isFilled = rating <= displayValue
        return (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            onMouseLeave={handleMouseLeave}
            disabled={readOnly}
            className={cn(
              'star-rating',
              sizeConfig[size],
              !readOnly && 'cursor-pointer',
              readOnly && 'cursor-default'
            )}
            style={{
              color: isFilled ? '#FBBF24' : '#CBD5E1',
            }}
          >
            <Star
              className="w-full h-full"
              fill={isFilled ? 'currentColor' : 'none'}
              strokeWidth={2}
            />
          </button>
        )
      })}
      {readOnly && value > 0 && (
        <span className="ml-2 text-sm text-slate-500 font-medium">{value.toFixed(1)}</span>
      )}
    </div>
  )
}
