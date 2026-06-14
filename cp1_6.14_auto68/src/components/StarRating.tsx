import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: number;
}

export function StarRating({ value, onChange, readonly = false, size = 24 }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue !== null ? hoverValue : value;

  const handleClick = (index: number) => {
    if (!readonly && onChange) {
      onChange(index + 1);
    }
  };

  return (
    <div className="flex gap-1">
      {[0, 1, 2, 3, 4].map((index) => {
        const isFilled = index < displayValue;
        return (
          <button
            key={index}
            type={readonly ? 'button' : 'button'}
            className={`transition-all duration-200 ${!readonly ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}
            onClick={() => handleClick(index)}
            onMouseEnter={() => !readonly && setHoverValue(index + 1)}
            onMouseLeave={() => !readonly && setHoverValue(null)}
            style={{
              transform: !readonly && hoverValue === index + 1 ? 'scale(1.2)' : 'scale(1)',
            }}
            disabled={readonly}
          >
            <Star
              size={size}
              fill={isFilled ? '#e67e22' : 'none'}
              color={isFilled ? '#e67e22' : '#d1d5db'}
              strokeWidth={2}
              className="transition-all duration-300"
              style={{
                filter: isFilled ? 'drop-shadow(0 0 4px rgba(230, 126, 34, 0.4))' : 'none',
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
