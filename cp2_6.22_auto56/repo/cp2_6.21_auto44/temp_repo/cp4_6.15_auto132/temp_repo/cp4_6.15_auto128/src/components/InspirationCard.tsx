import { useMemo } from 'react';
import StarRating from './StarRating';
import type { PublicCardData } from '../types';
import '../styles/InspirationCard.css';

interface InspirationCardProps {
  card: PublicCardData;
  highlightQuery?: string;
  onOpenComments: () => void;
  onToast: (message: string, type?: 'success' | 'error') => void;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text;

  const cleanQuery = query.trim();
  if (!cleanQuery) return text;

  const regex = new RegExp(`(${escapeRegExp(cleanQuery)})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="search-highlight">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (diff < 60000) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  const date = new Date(timestamp);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export default function InspirationCard({
  card,
  highlightQuery = '',
  onOpenComments,
  onToast,
}: InspirationCardProps) {
  const timeAgo = useMemo(() => formatTimeAgo(card.createdAt), [card.createdAt]);

  const isNew = useMemo(() => {
    return Date.now() - card.createdAt < 24 * 60 * 60 * 1000;
  }, [card.createdAt]);

  const isHot = useMemo(() => {
    return card.averageRating >= 4.5 && card.ratingCount >= 3;
  }, [card.averageRating, card.ratingCount]);

  return (
    <article className={`inspiration-card ${card.hasRated ? 'has-rated' : ''}`}>
      {card.imageUrl && (
        <div className="card-image-wrapper">
          <img
            src={card.imageUrl}
            alt={card.title}
            className="card-image"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="card-badges">
            {isNew && <span className="badge badge-new">NEW</span>}
            {isHot && <span className="badge badge-hot">🔥 HOT</span>}
          </div>
        </div>
      )}

      {!card.imageUrl && (isNew || isHot) && (
        <div className="card-badges card-badges-top">
          {isNew && <span className="badge badge-new">NEW</span>}
          {isHot && <span className="badge badge-hot">🔥 HOT</span>}
        </div>
      )}

      <div className="card-content">
        <h3 className="card-title">{highlightText(card.title, highlightQuery)}</h3>

        {card.description && (
          <p className="card-description">
            {highlightText(card.description, highlightQuery)}
          </p>
        )}

        <div className="card-meta-top">
          <span className="card-time">⏱ {timeAgo}</span>
        </div>
      </div>

      <div className="card-footer">
        <div className="card-rating-section">
          <StarRating
            cardId={card.id}
            averageRating={card.averageRating}
            ratingCount={card.ratingCount}
            hasRated={card.hasRated}
            onRated={() => onToast('评分成功！')}
            onToast={onToast}
          />
        </div>

        <button
          type="button"
          className="comment-btn"
          onClick={onOpenComments}
          aria-label={`查看评论，共${card.commentCount}条`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{card.commentCount}</span>
        </button>
      </div>
    </article>
  );
}
