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
  const [clickedStar, setClickedStar] = useState<number | null>(null)

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
    setClickedStar(index)
    setTimeout(() => setClickedStar(null), 300)
  }

  const displayValue = hoverValue ?? value

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((index) => {
        const isFilled = index <= displayValue
        const isHovered = hoverValue === index
        const isClicked = clickedStar === index

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseMove(index)}
            onMouseLeave={handleMouseLeave}
            className={cn(
              'transition-transform duration-200 ease-out',
              !readOnly && 'cursor-pointer',
              readOnly && 'cursor-default',
              isHovered && 'scale-125',
              isClicked && 'animate-star-bounce',
            )}
            disabled={readOnly}
          >
            <Star
              size={size}
              className={cn(
                'transition-all duration-300',
                isFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-200',
                isClicked && 'animate-star-fill',
              )}
            />
          </button>
        )
      })}
      <style>{`
        @keyframes star-bounce {
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
      @keyframes star-fill {
        0% {
          fill-opacity: 0;
        }
        50% {
          fill-opacity: 1;
        }
        100% {
          fill-opacity: 1;
        }
      }
      .animate-star-bounce {
        animation: star-bounce 0.3s ease-out;
      }
      .animate-star-fill {
        animation: star-fill 0.3s ease-out;
      }
    `}</style>
    </div>
  )
}
