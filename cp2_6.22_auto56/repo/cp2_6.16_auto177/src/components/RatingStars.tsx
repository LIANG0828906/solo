interface RatingStarsProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export default function RatingStars({ rating, size = 'md', showValue = false }: RatingStarsProps) {
  const clamped = Math.max(1, Math.min(5, rating));
  const sizeMap = { sm: 14, md: 18, lg: 24 };
  const s = sizeMap[size];

  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex items-center" style={{ gap: '6px' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            style={{
              fontSize: `${s}px`,
              lineHeight: 1,
              transition: 'transform 0.3s ease',
              display: 'inline-block',
              color: i <= clamped ? '#F1C40F' : '#D1D5DB',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLSpanElement).style.transform = 'scale(1.2)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLSpanElement).style.transform = 'scale(1)';
            }}
          >
            ★
          </span>
        ))}
      </div>
      {showValue && <span className="text-xs text-secondary/70 ml-1">({rating})</span>}
    </div>
  );
}
