import React, { useState } from 'react';

interface Props {
  rating: number;
  onChange: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md';
}

export default function StarRating({ rating, onChange, readonly = false, size = 'md' }: Props) {
  const [hoverRating, setHoverRating] = useState(0);
  const starSize = size === 'sm' ? 18 : 24;

  return (
    <div className="inline-flex gap-1" role="radiogroup" aria-label="评分">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hoverRating || rating);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            role="radio"
            aria-checked={star === rating}
            aria-label={`${star}星`}
            className="relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-amber rounded disabled:cursor-default cursor-pointer"
            onClick={() => onChange(star)}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
          >
            <svg
              width={starSize}
              height={starSize}
              viewBox="0 0 24 24"
              fill={filled ? '#FFBF00' : 'none'}
              stroke={filled ? '#E5AC00' : '#D4B896'}
              strokeWidth="1.5"
              className="transition-all duration-150"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
