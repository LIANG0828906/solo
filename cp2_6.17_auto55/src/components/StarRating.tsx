interface StarRatingProps {
  rating: number;
  onRate?: (rating: 1 | 2 | 3 | 4 | 5) => void;
  readonly?: boolean;
}

const StarRating = ({ rating, onRate, readonly = false }: StarRatingProps) => {
  const stars: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];

  return (
    <div className="star-rating">
      {stars.map((star) => (
        <span
          key={star}
          className={`star ${star <= rating ? 'filled' : ''}`}
          onClick={() => !readonly && onRate?.(star)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default StarRating;
