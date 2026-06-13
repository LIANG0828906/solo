import { useState } from 'react';

interface RatingStarsProps {
  value: number;
  editable?: boolean;
  onChange?: (value: number) => void;
  size?: number;
}

export default function RatingStars({
  value,
  editable = false,
  onChange,
  size = 20,
}: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue !== null ? hoverValue : value;

  const handleClick = (index: number) => {
    if (editable && onChange) {
      onChange(index + 1);
    }
  };

  const handleMouseEnter = (index: number) => {
    if (editable) {
      setHoverValue(index + 1);
    }
  };

  const handleMouseLeave = () => {
    if (editable) {
      setHoverValue(null);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '2px',
      }}
    >
      {[0, 1, 2, 3, 4].map((index) => {
        const filled = index < Math.round(displayValue);
        return (
          <svg
            key={index}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            style={{
              color: filled ? '#FF6F00' : '#ddd',
              transition: 'color 0.3s ease',
              cursor: editable ? 'pointer' : 'default',
            }}
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill="currentColor"
            />
          </svg>
        );
      })}
    </div>
  );
}
