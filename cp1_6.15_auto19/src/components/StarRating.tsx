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
    setTimeout(() => setBounceStar(null), 500)
  }

  return (
    <span className="rating">
      <span className="stars">
        {[1, 2, 3, 4, 5].map((star) => {
          let starClass = 'star'
          if (star <= fullStars) {
            starClass += ''
          } else if (star === fullStars + 1 && hasHalfStar && !interactive) {
            starClass += ''
          } else {
            starClass += ' empty'
          }
          if (bounceStar === star) {
            starClass += ' bounce'
          }

          return (
            <span
              key={star}
              className={starClass}
              style={{ fontSize: sizeMap[size] }}
              onClick={() => handleClick(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
            >
              {star <= fullStars || (star === fullStars + 1 && hasHalfStar && !interactive)
                ? '★'
                : star === fullStars + 1 && hasHalfStar
                ? '★'
                : '☆'}
            </span>
          )
        })}
      </span>
      {showValue && (
        <span style={{ marginLeft: '8px', fontWeight: 700, color: 'var(--color-dark-brown)' }}>
          {rating.toFixed(1)}
        </span>
      )}
    </span>
  )
}
