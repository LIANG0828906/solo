import { useState } from 'react';
import { Star } from 'lucide-react';

interface MiniStarRatingProps {
  rating: number;
  onRate?: (rating: number) => void;
  size?: number;
  readOnly?: boolean;
}

export default function MiniStarRating({ rating, onRate, size = 16, readOnly = false }: MiniStarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const [animatingStar, setAnimatingStar] = useState(0);

  const displayRating = hovered || rating;

  const handleClick = (star: number) => {
    if (readOnly || !onRate) return;
    setAnimatingStar(star);
    onRate(star);
    setTimeout(() => setAnimatingStar(0), 300);
  };

  return (
    <div className="flex gap-0.5" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= Math.round(displayRating);
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onClick={() => handleClick(star)}
            className={`${readOnly ? 'cursor-default' : 'cursor-pointer'} transition-transform duration-150 ${
              animatingStar === star ? 'animate-star-bounce' : ''
            }`}
            style={{ animationDelay: animatingStar === star ? '0ms' : undefined }}
          >
            <Star
              size={size}
              className={`transition-all duration-200 ${
                isActive ? 'fill-warm-gold text-warm-gold' : 'text-warm-border'
              } ${!readOnly && 'hover:scale-110'}`}
            />
          </button>
        );
      })}
    </div>
  );
}
