import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
  animated?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  size = 16, 
  animated = true 
}) => {
  const [visibleStars, setVisibleStars] = useState(animated ? 0 : 5);

  useEffect(() => {
    if (animated) {
      let current = 0;
      const timer = setInterval(() => {
        current++;
        setVisibleStars(current);
        if (current >= 5) clearInterval(timer);
      }, 150);
      return () => clearInterval(timer);
    }
  }, [animated, rating]);

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="star-rating" style={{ display: 'flex', gap: '2px' }}>
      {[...Array(5)].map((_, i) => {
        const isVisible = !animated || i < visibleStars;
        const isFull = i < fullStars;
        const isHalf = i === fullStars && hasHalfStar;

        return (
          <div
            key={i}
            className="star-wrapper"
            style={{
              position: 'relative',
              width: size,
              height: size,
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'scale(1)' : 'scale(0.5)',
              transition: 'all 0.2s ease-out',
            }}
          >
            <Star
              size={size}
              fill="#2a2a3a"
              stroke="#2a2a3a"
              style={{ position: 'absolute', top: 0, left: 0 }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: isHalf ? '50%' : isFull ? '100%' : '0%',
                height: '100%',
                overflow: 'hidden',
                transition: animated ? 'width 0.3s ease-out' : 'none',
              }}
            >
              <Star
                size={size}
                fill="#ffd700"
                stroke="#ffd700"
                style={{ filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
