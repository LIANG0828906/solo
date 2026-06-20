import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  max?: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({
  rating,
  max = 10,
  onChange,
  size = 'md',
}: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const [pulsing, setPulsing] = useState<number | null>(null);

  const sizeMap = { sm: 14, md: 18, lg: 24 };
  const fontSize = sizeMap[size];

  const display = hover || rating;

  const handleClick = (i: number) => {
    if (!onChange) return;
    const newRating = display === i && i === 1 ? 0 : i;
    onChange(newRating);
    setPulsing(i);
    setTimeout(() => setPulsing(null), 400);
  };

  return (
    <div className="stars">
      {Array.from({ length: max }, (_, i) => i + 1).map((i) => (
        <span
          key={i}
          className={`star ${i <= display ? 'filled' : ''} ${onChange ? 'clickable' : ''} ${pulsing === i ? 'pulse' : ''}`}
          style={{ fontSize: `${fontSize}px` }}
          onClick={() => handleClick(i)}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => setHover(0)}
        >
          ★
        </span>
      ))}
      {onChange && (
        <span style={{ marginLeft: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
          {rating > 0 ? `${rating}/${max}` : '未评分'}
        </span>
      )}
    </div>
  );
}
