import { useState, useCallback, useRef } from 'react'

interface StarRatingProps {
  rating: number
  interactive?: boolean
  onChange?: (rating: number) => void
  size?: 'small' | 'medium' | 'large'
  showValue?: boolean
}

export default function StarRating({
  rating,
  interactive = false,
  onChange,
  size = 'medium',
  showValue = false
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)
  const [bounceKey, setBounceKey] = useState(0)
  const [lastClickedStar, setLastClickedStar] = useState<number | null>(null)
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const sizeMap = {
    small: '14px',
    medium: '18px',
    large: '32px'
  }

  const displayRating = interactive ? (hoverRating || rating) : rating
  const fullStars = Math.floor(displayRating)
  const hasHalfStar = displayRating % 1 >= 0.5

  const handleClick = useCallback((star: number) => {
    if (!interactive) return

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
    }

    onChange?.(star)
    setLastClickedStar(star)
    setBounceKey(prev => prev + 1)

    clickTimeoutRef.current = setTimeout(() => {
      setLastClickedStar(null)
    }, 700)
  }, [interactive, onChange])

  return (
    <span className="rating">
      <span className="stars" style={{ display: 'inline-flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star, idx) => {
          const isFilled = star <= fullStars || (star === fullStars + 1 && hasHalfStar && !interactive)
          const isBouncing = lastClickedStar !== null && star <= lastClickedStar

          return (
            <span
              key={`${star}-${bounceKey}-${rating}`}
              className={`star ${isFilled ? '' : 'empty'} ${isBouncing ? 'bounce' : ''}`}
              style={{
                fontSize: sizeMap[size],
                cursor: interactive ? 'pointer' : 'default',
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                display: 'inline-block',
                animationDelay: isBouncing ? `${idx * 60}ms` : '0ms',
                transform: interactive && hoverRating >= star ? 'scale(1.3) translateY(-2px)' : undefined,
                filter: isFilled ? 'drop-shadow(0 2px 4px rgba(255, 215, 0, 0.3))' : undefined,
                userSelect: 'none'
              }}
              onClick={() => handleClick(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
            >
              {isFilled ? '★' : '☆'}
            </span>
          )
        })}
      </span>
      {showValue && (
        <span style={{
          marginLeft: '8px',
          fontWeight: 700,
          color: 'var(--color-dark-brown)',
          fontSize: size === 'large' ? '18px' : size === 'small' ? '12px' : '14px'
        }}>
          {rating.toFixed(1)}
        </span>
      )}
    </span>
  )
}
