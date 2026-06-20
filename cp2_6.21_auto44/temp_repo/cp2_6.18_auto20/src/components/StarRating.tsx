import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: 1 | 2 | 3 | 4 | 5) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

export default function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const displayValue = hoverValue ?? value
  const starSize = sizeMap[size]

  const handleClick = (index: number) => {
    if (readonly || !onChange) return
    onChange((index + 1) as 1 | 2 | 3 | 4 | 5)
  }

  const handleMouseEnter = (index: number) => {
    if (readonly) return
    setHoverValue(index + 1)
  }

  const handleMouseLeave = () => {
    if (readonly) return
    setHoverValue(null)
  }

  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((index) => (
        <button
          key={index}
          type="button"
          onClick={() => handleClick(index)}
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={handleMouseLeave}
          className={cn(
            'transition-transform duration-150',
            !readonly && 'hover:scale-125 cursor-pointer',
            readonly && 'cursor-default'
          )}
          disabled={readonly}
        >
          <Star
            className={cn(
              starSize,
              'transition-all duration-150',
              index < displayValue
                ? 'fill-[#F59E0B] text-[#F59E0B]'
                : 'text-gray-300'
            )}
          />
        </button>
      ))}
    </div>
  )
}
