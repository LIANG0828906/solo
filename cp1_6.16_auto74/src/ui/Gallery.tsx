import { useState, useEffect, useCallback } from 'react';
import { EventBus } from '@/data/EventBus';
import { Artwork } from '@/data/types';

interface GalleryProps {
  eventBus: EventBus;
  onArtworkClick: (artwork: Artwork) => void;
}

export default function Gallery({ eventBus, onArtworkClick }: GalleryProps) {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsub = eventBus.on<Artwork[]>('filtered', (data) => {
      setArtworks(data);
      const newSet = new Set(data.map((a) => a.id));
      setAnimatingIds(newSet);
      setTimeout(() => setAnimatingIds(new Set()), data.length * 100 + 500);
    });
    return unsub;
  }, [eventBus]);

  const handleCardClick = useCallback(
    (artwork: Artwork) => {
      onArtworkClick(artwork);
    },
    [onArtworkClick]
  );

  if (artworks.length === 0) {
    return (
      <div className="gallery-empty">
        <p>没有找到匹配的作品</p>
        <p className="gallery-empty-sub">尝试调整筛选条件</p>
      </div>
    );
  }

  return (
    <div className="gallery">
      {artworks.map((artwork, index) => (
        <div
          key={artwork.id}
          className={`gallery-card ${animatingIds.has(artwork.id) ? 'fade-in' : ''}`}
          style={{ animationDelay: animatingIds.has(artwork.id) ? `${index * 100}ms` : '0ms' }}
          onClick={() => handleCardClick(artwork)}
        >
          <div className="card-image-wrapper">
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              className="card-image"
              loading="lazy"
            />
          </div>
          <div className="card-content">
            <h3 className="card-title">{artwork.title}</h3>
            <div className="card-tags">
              {artwork.colorTags.slice(0, 2).map((color) => (
                <span
                  key={color}
                  className="card-color-dot"
                  style={{ backgroundColor: color }}
                />
              ))}
              {artwork.styleTags.slice(0, 3 - Math.min(artwork.colorTags.length, 2)).map((style) => (
                <span key={style} className="card-style-tag">
                  {style}
                </span>
              ))}
              {artwork.colorTags.length + artwork.styleTags.length > 3 && (
                <span className="card-more-badge">
                  +{artwork.colorTags.length + artwork.styleTags.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
