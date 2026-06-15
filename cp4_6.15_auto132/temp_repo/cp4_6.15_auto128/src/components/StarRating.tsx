import { useState } from 'react';
import { rateCard } from '../utils/api';
import '../styles/StarRating.css';

interface StarRatingProps {
  cardId: string;
  averageRating: number;
  ratingCount: number;
  hasRated: boolean;
  onRated: (average: number, count: number) => void;
  onToast: (message: string, type?: 'success' | 'error') => void;
}

export default function StarRating({
  cardId,
  averageRating,
  ratingCount,
  hasRated,
  onRated,
  onToast,
}: StarRatingProps) {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const displayRating = hasRated ? averageRating : hoveredStar || averageRating;
  const filledStars = Math.round(displayRating * 2) / 2;

  const handleStarClick = async (score: number) => {
    if (hasRated || submitting) return;

    setSubmitting(true);
    try {
      const result = await rateCard(cardId, score);
      onRated(result.averageRating, result.ratingCount);
    } catch (err) {
      onToast(err instanceof Error ? err.message : '评分失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStar = (index: number) => {
    const starValue = index + 1;
    let fillPercent = 0;

    if (filledStars >= starValue) {
      fillPercent = 100;
    } else if (filledStars > starValue - 1) {
      fillPercent = (filledStars - (starValue - 1)) * 100;
    }

    return (
      <button
        key={index}
        type="button"
        className={`star-btn ${submitting ? 'disabled' : ''} ${hasRated ? 'readonly' : ''}`}
        onMouseEnter={() => !hasRated && !submitting && setHoveredStar(starValue)}
        onMouseLeave={() => setHoveredStar(0)}
        onClick={() => handleStarClick(starValue)}
        disabled={hasRated || submitting}
        title={hasRated ? '您已评分' : `${starValue} 星`}
      >
        <svg viewBox="0 0 24 24" className="star-icon" aria-hidden="true">
          <defs>
            <linearGradient id={`grad-${cardId}-${index}`}>
              <stop offset={`${fillPercent}%`} stopColor="var(--color-star)" />
              <stop offset={`${fillPercent}%`} stopColor="var(--color-star-empty)" />
            </linearGradient>
          </defs>
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            fill={`url(#grad-${cardId}-${index})`}
          />
        </svg>
      </button>
    );
  };

  return (
    <div className="star-rating-container">
      <div className="stars-wrapper">
        {[0, 1, 2, 3, 4].map(renderStar)}
      </div>
      <div className="rating-meta">
        <span className="rating-value">
          {averageRating > 0 ? averageRating.toFixed(1) : '—'}
        </span>
        <span className="rating-count">({ratingCount})</span>
        {hasRated && <span className="rated-badge">已评</span>}
      </div>
    </div>
  );
}
