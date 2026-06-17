import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
}

export function StarRating({ rating, onChange, size = 24, readonly = false }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || rating;

  const handleClick = (value: number) => {
    if (readonly || !onChange) return;
    onChange(value === rating ? 0 : value);
  };

  return (
    <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          className={`transition-transform ${!readonly ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
          style={{ width: size, height: size }}
          disabled={readonly}
        >
          <Star
            size={size}
            className="transition-colors duration-200"
            style={{
              fill: star <= displayRating 
                ? `url(#starGradient-${star <= displayRating})` 
                : 'none',
              stroke: star <= displayRating ? '#E67E22' : '#D4C9B8',
              strokeWidth: 1.5,
            }}
          />
          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <defs>
              <linearGradient id={`starGradient-${true}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F39C12" />
                <stop offset="100%" stopColor="#E67E22" />
              </linearGradient>
            </defs>
          </svg>
        </button>
      ))}
    </div>
  );
}
