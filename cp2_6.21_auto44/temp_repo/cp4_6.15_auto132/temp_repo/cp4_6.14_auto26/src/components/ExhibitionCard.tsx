import { memo } from 'react';
import { Calendar, Image as ImageIcon } from 'lucide-react';
import type { Exhibition } from '@/data/mockData';
import { formatDate } from '@/data/mockData';

interface ExhibitionCardProps {
  exhibition: Exhibition;
  onClick: () => void;
}

export const ExhibitionCard = memo(function ExhibitionCard({ exhibition, onClick }: ExhibitionCardProps) {
  return (
    <div className="exhibition-card" onClick={onClick}>
      <div className="exhibition-card__cover">
        <img
          src={exhibition.coverUrl}
          alt={exhibition.name}
          className="exhibition-card__cover-img"
          loading="lazy"
        />
        <div className="exhibition-card__cover-overlay" />
      </div>
      <div className="exhibition-card__body">
        <h3 className="exhibition-card__title">{exhibition.name}</h3>
        <p className="exhibition-card__theme">{exhibition.theme}</p>
        <div className="exhibition-card__footer">
          <span className="exhibition-card__meta">
            <Calendar size={14} strokeWidth={1.5} />
            {formatDate(exhibition.createdAt)}
          </span>
          <span className="exhibition-card__meta">
            <ImageIcon size={14} strokeWidth={1.5} />
            {exhibition.artworkIds.length} 件作品
          </span>
        </div>
      </div>
    </div>
  );
});
