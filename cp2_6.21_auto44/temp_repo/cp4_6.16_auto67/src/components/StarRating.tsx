import { useState, useCallback } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 'md',
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);
  const [animatingStars, setAnimatingStars] = useState<number[]>([]);

  const displayValue = hoverValue || value;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const handleClick = useCallback(
    (rating: number) => {
      if (readOnly || !onChange) return;

      const newAnimating: number[] = [];
      for (let i = 1; i <= rating; i++) {
        newAnimating.push(i);
      }
      setAnimatingStars(newAnimating);

      onChange(rating);

      setTimeout(() => {
        setAnimatingStars([]);
      }, 600);
    },
    [readOnly, onChange],
  );

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => handleClick(star)}
          onMouseEnter={() => !readOnly && setHoverValue(star)}
          onMouseLeave={() => !readOnly && setHoverValue(0)}
          className={`
            transition-all duration-200 ease-out
            ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-125'}
            ${animatingStars.includes(star) ? 'animate-wave-fill' : ''}
          `}
          style={{
            animationDelay: animatingStars.includes(star)
              ? `${(star - 1) * 80}ms`
              : '0ms',
          }}
        >
          <Star
            className={`${sizeClasses[size]} transition-colors duration-200`}
            fill={star <= displayValue ? '#ffb347' : 'none'}
            stroke={star <= displayValue ? '#ffb347' : '#6b7280'}
            strokeWidth={2}
          />
        </button>
      ))}
    </div>
  );
}
