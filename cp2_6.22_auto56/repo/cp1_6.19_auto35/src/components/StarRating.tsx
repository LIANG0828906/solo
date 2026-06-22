import { useState } from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)

  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const iconSize = sizeMap[size]

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value)
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={`p-0.5 transition-transform duration-150 ${
              readonly ? 'cursor-default' : 'cursor-pointer'
            } ${
              !readonly && star === hovered && star !== value
                ? 'animate-elastic-bounce'
                : ''
            }`}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
          >
            <Star
              className={`${iconSize} transition-colors duration-150 ${
                filled
                  ? 'text-accent-500 fill-accent-500'
                  : 'text-surface-300'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}
