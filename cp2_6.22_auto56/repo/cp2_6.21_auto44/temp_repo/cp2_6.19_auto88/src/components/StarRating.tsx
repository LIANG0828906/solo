import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  readonly?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({ rating, maxRating = 5, readonly = false, onChange }: StarRatingProps) {
  const handleClick = (index: number) => {
    if (!readonly && onChange) {
      onChange(index + 1);
    }
  };

  return (
    <div className={`star-rating ${readonly ? 'readonly' : ''}`}>
      {Array.from({ length: maxRating }).map((_, index) => (
        <Star
          key={index}
          className={`star ${index < Math.round(rating) ? 'filled' : ''}`}
          onClick={() => handleClick(index)}
        />
      ))}
    </div>
  );
}
