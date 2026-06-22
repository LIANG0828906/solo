import { useState } from 'react';
import type { Movie } from '../api';
import { getRatingGradientColor } from '../api';

interface MovieCardProps {
  movie: Movie;
  onUpdateRating: (id: string, rating: number) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  isDragging?: boolean;
}

function MovieCard({
  movie,
  onUpdateRating,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}: MovieCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating > 0 ? hoverRating : movie.rating;
  const posterBg = getRatingGradientColor(movie.rating);

  const handleCardClick = () => {
    setIsFlipped(f => !f);
  };

  const handleRatingClick = (e: React.MouseEvent, star: number) => {
    e.stopPropagation();
    onUpdateRating(movie.id, star);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(movie.id);
  };

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, movie.id)}
      onDragOver={onDragOver}
      onDrop={e => onDrop(e, movie.id)}
      onClick={handleCardClick}
      style={{
        ...styles.cardContainer,
        width: '180px',
        height: '260px',
        opacity: isDragging ? 0.4 : 1,
        cursor: 'pointer',
        transition: 'opacity 0.2s',
      }}
    >
      <div
        style={{
          ...styles.cardInner,
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div
          style={{
            ...styles.cardFront,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              ...styles.poster,
              background: posterBg,
            }}
          >
            <span style={styles.posterIcon}>🎬</span>
          </div>
          <div style={styles.titleSection}>
            <div style={styles.title} title={movie.title}>
              {movie.title}
            </div>
            <div style={styles.yearText}>{movie.year}</div>
          </div>
          <div
            style={styles.stars}
            onMouseLeave={() => setHoverRating(0)}
            onClick={e => e.stopPropagation()}
          >
            {[1, 2, 3, 4, 5].map(star => (
              <span
                key={star}
                onClick={e => handleRatingClick(e, star)}
                onMouseEnter={() => setHoverRating(star)}
                style={{
                  ...styles.star,
                  color: star <= displayRating ? '#ffd700' : '#adb5bd',
                  transition: 'all 0.2s ease',
                }}
              >
                {star <= displayRating ? '★' : '☆'}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            ...styles.cardBack,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            background: `linear-gradient(135deg, #2d2d44 0%, #1a1a2e 100%)`,
          }}
        >
          <div style={styles.backTitle}>{movie.title}</div>
          <div style={styles.backMeta}>
            <span>🎥 {movie.director}</span>
          </div>
          <div style={styles.backMeta}>
            <span>📅 {movie.watchDate}</span>
          </div>
          <div style={styles.backMeta}>
            <span>⭐ {movie.rating}/5</span>
          </div>
          <div style={styles.reviewTitle}>短评:</div>
          <div style={styles.reviewText}>
            {movie.review || '暂无短评，点击卡片翻回去编辑~'}
          </div>
          <button
            onClick={handleDelete}
            style={styles.deleteBtn}
          >
            🗑️ 删除
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  cardContainer: {
    perspective: '1000px',
    flexShrink: 0,
  },
  cardInner: {
    position: 'relative',
    width: '100%',
    height: '100%',
    transformStyle: 'preserve-3d',
    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  cardFront: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#2d2d44',
    display: 'flex',
    flexDirection: 'column',
  },
  cardBack: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    transform: 'rotateY(180deg)',
    borderRadius: '12px',
    padding: '16px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  poster: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '120px',
  },
  posterIcon: {
    fontSize: '48px',
    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))',
  },
  titleSection: {
    padding: '10px 12px 6px',
  },
  title: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.3,
  },
  yearText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '12px',
    marginTop: '2px',
  },
  stars: {
    padding: '6px 12px 12px',
    display: 'flex',
    gap: '2px',
  },
  star: {
    fontSize: '18px',
    userSelect: 'none',
  },
  backTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#fff',
    marginBottom: '4px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    paddingBottom: '8px',
  },
  backMeta: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 1.6,
  },
  reviewTitle: {
    fontSize: '12px',
    color: '#667eea',
    fontWeight: 600,
    marginTop: '6px',
  },
  reviewText: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.5,
    flex: 1,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
  },
  deleteBtn: {
    padding: '8px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    color: '#ff6b6b',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default MovieCard;
