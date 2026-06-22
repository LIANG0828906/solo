import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({
  rating,
  size = 20,
  interactive = false,
  onChange,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || rating;

  const handleMouseEnter = (index: number) => {
    if (!interactive) return;
    setHoverRating(index);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setHoverRating(0);
  };

  const handleClick = (index: number) => {
    if (!interactive || !onChange) return;
    onChange(index);
  };

  return (
    <span
      className="star-rating"
      style={{ display: 'inline-flex', gap: '2px', cursor: interactive ? 'pointer' : 'default' }}
      onMouseLeave={handleMouseLeave}
    >
      {[1, 2, 3, 4, 5].map((index) => (
        <span
          key={index}
          onMouseEnter={() => handleMouseEnter(index)}
          onClick={() => handleClick(index)}
          style={{
            fontSize: size,
            lineHeight: 1,
            color: index <= displayRating ? '#FF7043' : '#D7CCC8',
            transition: 'color 0.15s ease',
            userSelect: 'none',
          }}
        >
          {index <= displayRating ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}
