import { useState } from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: number
}

export const StarRating = ({ value, onChange, readonly = false, size = 20 }: StarRatingProps) => {
  const [hoverValue, setHoverValue] = useState(0)
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null)

  const handleClick = (index: number) => {
    if (readonly) return
    setAnimatingIndex(index)
    onChange?.(index + 1)
    setTimeout(() => setAnimatingIndex(null), 300)
  }

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4].map((index) => {
        const isFilled = (hoverValue || value) > index
        const isAnimating = animatingIndex === index
        
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(index)}
            onMouseEnter={() => !readonly && setHoverValue(index + 1)}
            onMouseLeave={() => !readonly && setHoverValue(0)}
            disabled={readonly}
            className={`transition-all duration-200 ${
              !readonly ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            } ${isAnimating ? 'animate-star-pop' : ''}`}
          >
            <Star
              size={size}
              fill={isFilled ? '#FFC107' : 'none'}
              color={isFilled ? '#FFC107' : '#E4D9C8'}
              strokeWidth={2}
            />
          </button>
        )
      })}
    </div>
  )
}
