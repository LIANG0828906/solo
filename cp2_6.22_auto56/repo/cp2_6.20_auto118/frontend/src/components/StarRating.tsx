import { useState, useCallback } from 'react';

interface StarRatingProps {
  value?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
}

const StarRating = ({ value = 0, onChange, readOnly = false }: StarRatingProps) => {
  const [hoverValue, setHoverValue] = useState<number>(0);

  const handleClick = useCallback(
    (rating: number) => {
      if (readOnly) return;
      onChange?.(rating);
    },
    [onChange, readOnly]
  );

  const handleMouseEnter = useCallback(
    (rating: number) => {
      if (readOnly) return;
      setHoverValue(rating);
    },
    [readOnly]
  );

  const handleMouseLeave = useCallback(() => {
    if (readOnly) return;
    setHoverValue(0);
  }, [readOnly]);

  const displayValue = hoverValue || value;

  return (
    <div className={`star-rating${readOnly ? ' read-only' : ''}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= displayValue;
        return (
          <button
            key={star}
            type="button"
            className={`star${isActive ? ' active' : ''}${readOnly ? ' disabled' : ''}`}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={readOnly}
            aria-label={`${star}星`}
          >
            <svg
              viewBox="0 0 24 24"
              fill={isActive ? '#f59e0b' : 'none'}
              stroke={isActive ? '#f59e0b' : '#d4d4d4'}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
