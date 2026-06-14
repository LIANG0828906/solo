import { useState } from 'react'

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
  const [bounceStar, setBounceStar] = useState<number | null>(null)
  const [allBounce, setAllBounce] = useState(false)

  const sizeMap = {
    small: '14px',
    medium: '18px',
    large: '32px'
  }

  const displayRating = interactive ? (hoverRating || rating) : rating
  const fullStars = Math.floor(displayRating)
  const hasHalfStar = displayRating % 1 >= 0.5

  const handleClick = (star: number) => {
    if (!interactive) return
    onChange?.(star)
    setBounceStar(star)
    setAllBounce(true)
    setTimeout(() => setBounceStar(null), 600)
    setTimeout(() => setAllBounce(false), 600)
  }

  return (
    <span className="rating">
      <span className="stars" style={{ display: 'inline-flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star, idx) => {
          let starClass = 'star'
          const isFilled = star <= fullStars || (star === fullStars + 1 && hasHalfStar && !interactive)
          
          if (!isFilled) {
            starClass += ' empty'
          }

          if (allBounce || bounceStar === star) {
            starClass += ' bounce'
          }

          return (
            <span
              key={star}
              className={starClass}
              style={{
                fontSize: sizeMap[size],
                cursor: interactive ? 'pointer' : 'default',
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                display: 'inline-block',
                animationDelay: allBounce ? `${idx * 60}ms` : '0ms',
                transform: interactive && hoverRating >= star ? 'scale(1.3) translateY(-2px)' : undefined,
                filter: isFilled ? 'drop-shadow(0 2px 4px rgba(255, 215, 0, 0.3))' : undefined
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
