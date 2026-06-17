import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
  size?: number;
}

export const StarRating = ({ value, onChange, readOnly = false, size = 28 }: StarRatingProps) => {
  const [hoverValue, setHoverValue] = useState(0);
  const displayValue = hoverValue || value;

  const handleClick = (rating: number) => {
    if (!readOnly) {
      onChange(rating);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        cursor: readOnly ? 'default' : 'pointer',
      }}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayValue;
        return (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => !readOnly && setHoverValue(star)}
            onMouseLeave={() => !readOnly && setHoverValue(0)}
            disabled={readOnly}
            style={{
              width: size,
              height: size,
              background: 'none',
              border: 'none',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: readOnly ? 'default' : 'pointer',
              transition: 'transform 0.2s ease-out',
              transform: isFilled && !readOnly ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={isFilled ? '#FBBF24' : 'none'}
              stroke={isFilled ? '#FBBF24' : '#4A4470'}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transition: 'all 0.2s ease-out',
                filter: isFilled ? 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.4))' : 'none',
              }}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        );
      })}
    </div>
  );
};
