import React, { memo } from 'react';
import { Star, GitCompare, Check } from 'lucide-react';
import type { HistoryEvent } from '../types';
import { CATEGORIES } from '../types';

interface EventCardProps {
  event: HistoryEvent;
  isFavorite: boolean;
  isInCompare: boolean;
  isHighlighted: boolean;
  onToggleFavorite: () => void;
  onToggleCompare: () => void;
  index: number;
}

export const EventCard = memo(function EventCard({
  event,
  isFavorite,
  isInCompare,
  isHighlighted,
  onToggleFavorite,
  onToggleCompare,
  index,
}: EventCardProps) {
  const categoryInfo = CATEGORIES.find((c) => c.value === event.category);

  return (
    <div
      className={`event-card ${isHighlighted ? 'highlighted' : ''} ${isInCompare ? 'compare-mode' : ''}`}
      style={{ animationDelay: `${index * 0.05}s
      }
    >
      {isFavorite && (
        <div className="star-badge">
          <Star size={16} fill="#fbbf24" />
        </div>
      )}

      <div className="thumbnail-grid">
        {event.colors.map((color, i) => (
          <div
            key={i}
            className="thumbnail-cell"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      <div className="card-content">
        <div className="card-header">
          <span className="event-year">{event.year}</span>
          <span
            className="category-tag"
            style={{ backgroundColor: categoryInfo?.color + '20', color: categoryInfo?.color }}
          >
            {categoryInfo?.label}
          </span>
        </div>

        <h3 className="event-title">{event.title}</h3>

        <div className="event-description">
          {event.description.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>

        <div className="card-actions">
          <button
            className={`action-btn favorite-btn ${isFavorite ? 'active' : ''}`}
            onClick={onToggleFavorite}
            title={isFavorite ? '取消收藏' : '收藏'}
          >
            <Star size={18} fill={isFavorite ? '#fbbf24' : 'none'} />
            <span>{isFavorite ? '已收藏' : '收藏'}</span>
          </button>
          <button
            className={`action-btn compare-btn ${isInCompare ? 'active' : ''}`}
            onClick={onToggleCompare}
            title={isInCompare ? '移出对比' : '加入对比'}
          >
            {isInCompare ? <Check size={18} /> : <GitCompare size={18} />}
            <span>{isInCompare ? '已选' : '对比'}</span>
          </button>
        </div>
      </div>
    </div>
  );
});
