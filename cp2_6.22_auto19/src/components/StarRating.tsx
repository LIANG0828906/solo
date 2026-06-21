import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  ratingCount?: number;
  onRate?: (rating: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  ratingCount,
  onRate,
  interactive = false,
  size = 'md',
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(rating);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const handleClick = (value: number) => {
    if (!interactive || !onRate) return;
    setCurrentRating(value);
    onRate(value);
  };

  const displayRating = interactive ? hoverRating || currentRating : rating;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => handleClick(value)}
          onMouseEnter={() => interactive && setHoverRating(value)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={`${interactive ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}`}
          disabled={!interactive}
        >
          <Star
            className={`${sizeClasses[size]} transition-colors ${value <= displayRating ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`}
          />
        </button>
      ))}
      {ratingCount !== undefined && (
        <span className="ml-1 text-sm text-stone-500">
          ({ratingCount})
        </span>
      )}
    </div>
  );
};
