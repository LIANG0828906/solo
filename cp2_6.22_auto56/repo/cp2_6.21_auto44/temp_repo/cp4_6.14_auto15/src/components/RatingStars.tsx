import { useState } from 'react';

interface RatingStarsProps {
  value: number;
  editable?: boolean;
  onChange?: (value: number) => void;
  size?: number;
}

export default function RatingStars({ value, editable = false, onChange, size = 20 }: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState(0);
  const displayValue = editable && hoverValue > 0 ? hoverValue : value;
  const [animating, setAnimating] = useState(false);

  const handleClick = (v: number) => {
    if (!editable || !onChange) return;
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);
    onChange(v);
  };

  return (
    <div style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayValue;
        return (
          <svg
            key={star}
            onClick={() => handleClick(star)}
            onMouseEnter={() => editable && setHoverValue(star)}
            onMouseLeave={() => editable && setHoverValue(0)}
            width={size} height={size}
            viewBox="0 0 24 24"
            style={{
              cursor: editable ? 'pointer' : 'default',
              transition: 'transform 0.2s ease',
              transform: animating && star <= value ? 'scale(1.25)' : 'scale(1)',
            }}
          >
            <defs>
              <linearGradient id={`starGrad-${star}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFD54F" />
                <stop offset="100%" stopColor="#FF6F00" />
              </linearGradient>
            </defs>
            <polygon
              points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
              fill={filled ? `url(#starGrad-${star})` : '#E0E0E0'}
              stroke={filled ? '#FF6F00' : 'none'}
              strokeWidth={filled ? 0.5 : 0}
              style={{ transition: 'fill 0.3s ease, stroke 0.3s ease' }}
            />
          </svg>
        );
      })}
    </div>
  );
}
