import { memo } from 'react';
import { Eye } from 'lucide-react';
import type { Artwork } from '@/data/mockData';

interface ArtworkCardProps {
  artwork: Artwork;
  onSelect: (artwork: Artwork) => void;
  style?: React.CSSProperties;
}

export const ArtworkCard = memo(function ArtworkCard({ artwork, onSelect, style }: ArtworkCardProps) {
  return (
    <div
      className="artwork-card"
      style={style}
      onClick={() => onSelect(artwork)}
    >
      <div className="artwork-card__image-wrapper">
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="artwork-card__image"
          loading="lazy"
        />
        <div className="artwork-card__overlay">
          <div className="artwork-card__overlay-content">
            <Eye size={28} strokeWidth={1.5} />
            <p className="artwork-card__overlay-title">{artwork.title}</p>
          </div>
        </div>
      </div>
      <div className="artwork-card__info">
        <h3 className="artwork-card__title">{artwork.title}</h3>
        <p className="artwork-card__artist">{artwork.artist}</p>
      </div>
    </div>
  );
});
