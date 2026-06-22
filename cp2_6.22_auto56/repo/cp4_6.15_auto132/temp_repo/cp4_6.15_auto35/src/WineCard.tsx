import { memo } from 'react';
import type { Wine } from './types';
import { wineTypeLabel } from './utils';

interface WineCardProps {
  wine: Wine;
  onClick: () => void;
}

const WineCard = memo(function WineCard({ wine, onClick }: WineCardProps) {
  return (
    <div className="wine-card" onClick={onClick}>
      <div className="wine-card-image" style={{ background: wine.imageColor }}>
        <span className={`wine-type-badge ${wine.type}`}>
          {wineTypeLabel(wine.type)}
        </span>
        <svg
          width="60"
          height="60"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 2h8l1 7H7l1-7z" />
          <path d="M7 9v7a5 5 0 0 0 10 0V9" />
          <line x1="12" y1="22" x2="12" y2="16" />
        </svg>
      </div>
      <div className="wine-card-body">
        <div className="wine-card-name">{wine.name}</div>
        <div className="wine-card-meta">
          <span className="wine-card-vintage">{wine.vintage} 年</span>
          <span className="wine-card-rating">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {wine.rating}
          </span>
        </div>
        <div className="wine-card-region">
          {wine.country} · {wine.region}
        </div>
        <div className="wine-card-grapes">
          {wine.grapeVarieties.join('、')}
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.wine.id === next.wine.id &&
    prev.wine.rating === next.wine.rating &&
    prev.wine.name === next.wine.name &&
    prev.wine.imageColor === next.wine.imageColor
  );
});

export { WineCard };
export default WineCard;
