import React, { useState } from 'react';
import '../styles/StarRating.css';

interface StarRatingProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StarRating: React.FC<StarRatingProps> = ({
  value,
  max = 10,
  onChange,
  readOnly = false,
  size = 'md',
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const handleClick = (index: number) => {
    if (readOnly || !onChange) return;
    onChange(index + 1);
  };

  const handleMouseEnter = (index: number) => {
    if (readOnly) return;
    setHoverValue(index + 1);
  };

  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverValue(null);
  };

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className={`star-rating star-rating--${size}`}>
      {Array.from({ length: max }, (_, index) => {
        const isFilled = index < displayValue;
        const delay = isFilled ? index * 50 : 0;
        return (
          <span
            key={index}
            className={`star ${isFilled ? 'star--filled' : ''} ${readOnly ? 'star--readonly' : ''}`}
            style={{ animationDelay: `${delay}ms` }}
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            ★
          </span>
        );
      })}
    </div>
  );
};

export default StarRating;
