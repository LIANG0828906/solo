'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

const RATING_EMOJIS: Record<number, string> = {
  1: '😢',
  2: '😕',
  3: '🙂',
  4: '😊',
  5: '🤩',
};

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showEmoji?: boolean;
}

export function RatingStars({
  value,
  onChange,
  readOnly = false,
  size = 'md',
  showEmoji = true,
}: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState<number>(0);
  const displayValue = readOnly ? value : hoverValue || value;

  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const emojiSizeMap = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayValue;
          return (
            <button
              key={star}
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && onChange?.(star)}
              onMouseEnter={() => !readOnly && setHoverValue(star)}
              onMouseLeave={() => !readOnly && setHoverValue(0)}
              className={`p-1 transition-all duration-200 ${
                readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
              }`}
              aria-label={`${star}星`}
            >
              <Star
                className={`${sizeMap[size]} transition-colors duration-200 ${
                  isFilled ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm' : 'text-white/25'
                }`}
              />
            </button>
          );
        })}
      </div>
      {showEmoji && (
        <span
          className={`${emojiSizeMap[size]} transition-all duration-300 inline-block`}
          style={{ transform: displayValue >= 4 ? 'scale(1.1)' : 'scale(1)' }}
        >
          {RATING_EMOJIS[displayValue] || '🙂'}
        </span>
      )}
    </div>
  );
}
