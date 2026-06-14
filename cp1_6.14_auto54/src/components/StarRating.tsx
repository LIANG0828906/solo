import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readOnly?: boolean
  size?: number
}

export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 24,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const handleMouseMove = (index: number) => {
    if (readOnly) return
    setHoverValue(index)
  }

  const handleMouseLeave = () => {
    if (readOnly) return
    setHoverValue(null)
  }

  const handleClick = (index: number) => {
    if (readOnly || !onChange) return
    onChange(index)
  }

  const displayValue = hoverValue ?? value

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((index) => {
        const isFilled = index <= displayValue
        const isHovered = hoverValue === index
        const isReadOnly = readOnly

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(index)}
            onMouseMove={() => handleMouseMove(index)}
            onMouseLeave={handleMouseLeave}
            className={cn(
              'transition-all duration-200 ease-out',
              !isReadOnly && 'cursor-pointer',
              isReadOnly && 'cursor-default',
              isHovered && 'scale-125',
            )}
            disabled={isReadOnly}
          >
            <Star
              size={size}
              className={cn(
                'transition-all duration-300',
                isFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-200',
              )}
              style={{
                animation: isFilled && isHovered ? 'starFill 0.3s ease-out' : 'none',
              }}
            />
          </button>
        )
      })}
      <style>{`
        @keyframes starFill {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.3);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
