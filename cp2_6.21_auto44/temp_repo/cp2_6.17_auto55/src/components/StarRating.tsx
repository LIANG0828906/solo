interface StarRatingProps {
  rating: number;
  onChange?: (rating: 1 | 2 | 3 | 4 | 5) => void;
  interactive?: boolean;
  readonly?: boolean;
}

const StarRating = ({ rating, onChange, interactive = false, readonly = false }: StarRatingProps) => {
  const stars: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];
  const isInteractive = interactive && !readonly;

  return (
    <div className="star-rating">
      {stars.map((star) => (
        <span
          key={star}
          className={`star ${star <= rating ? 'filled' : ''}`}
          style={{ cursor: isInteractive ? 'pointer' : 'default' }}
          onClick={() => isInteractive && onChange?.(star)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default StarRating;
