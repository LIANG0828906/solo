import React, { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ value, onChange, size = 'md', readonly = false }) => {
  const [hoverValue, setHoverValue] = useState(0);
  const [animatedStar, setAnimatedStar] = useState<number | null>(null);

  const sizes = {
    sm: { size: 16, gap: 4 },
    md: { size: 24, gap: 6 },
    lg: { size: 36, gap: 10 },
  };

  const s = sizes[size];

  const handleClick = (star: number) => {
    if (readonly) return;
    setAnimatedStar(star);
    setTimeout(() => setAnimatedStar(null), 500);
    onChange?.(star);
  };

  const displayValue = hoverValue || value;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
      }}
      onMouseLeave={() => !readonly && setHoverValue(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= displayValue;
        const isAnimating = animatedStar === star;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => handleClick(star)}
            onMouseEnter={() => !readonly && setHoverValue(star)}
            style={{
              fontSize: s.size,
              lineHeight: 1,
              cursor: readonly ? 'default' : 'pointer',
              color: active ? '#FBBF24' : 'rgba(255,255,255,0.2)',
              transition: 'color 0.2s ease, transform 0.3s ease',
              background: 'none',
              border: 'none',
              padding: 2,
              animation: isAnimating ? 'scaleSpring 0.5s ease' : 'none',
              filter: active ? 'drop-shadow(0 2px 6px rgba(251,191,36,0.4))' : 'none',
              transform: hoverValue === star && !readonly ? 'scale(1.2)' : 'scale(1)',
            }}
          >
            ★
          </button>
        );
      })}
      {value > 0 && size !== 'sm' && (
        <span
          style={{
            marginLeft: 8,
            fontSize: size === 'lg' ? 16 : 13,
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}
        >
          {value.toFixed(1)}/5.0
        </span>
      )}
    </div>
  );
};

export default StarRating;
