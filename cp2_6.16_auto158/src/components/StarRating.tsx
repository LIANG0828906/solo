import React from 'react';
import { Star } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 18,
  interactive = false,
  onChange,
  className = '',
}) => {
  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index + 1);
    }
  };

  return (
    <div className={twMerge('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxRating }).map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => handleClick(index)}
          disabled={!interactive}
          className={twMerge(
            'transition-all duration-fast',
            interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
          )}
        >
          <Star
            size={size}
            className={twMerge(
              'transition-colors duration-fast',
              index < rating
                ? 'fill-warning text-warning'
                : 'fill-transparent text-border-color'
            )}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
