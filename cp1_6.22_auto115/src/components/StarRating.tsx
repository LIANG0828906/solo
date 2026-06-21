import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 16,
  md: 20,
  lg: 24,
};

export default function StarRating({ value, onChange, size = 'md' }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const isEditable = !!onChange;
  const starSize = sizeMap[size];
  const displayValue = hoverValue ?? value;

  const handleMouseEnter = (index: number) => {
    if (isEditable) {
      setHoverValue(index);
    }
  };

  const handleMouseLeave = () => {
    if (isEditable) {
      setHoverValue(null);
    }
  };

  const handleClick = (index: number) => {
    if (isEditable && onChange) {
      onChange(index);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((index) => (
        <div
          key={index}
          style={{
            cursor: isEditable ? 'pointer' : 'default',
            transition: 'transform 0.1s',
          }}
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(index)}
          onMouseOver={(e) => {
            if (isEditable) {
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            width={starSize}
            height={starSize}
            style={{
              color: index <= displayValue ? '#FFC107' : '#E5E7EB',
            }}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
      ))}
    </div>
  );
}
