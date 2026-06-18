import { useAppStore } from '@/store/useAppStore';
import type { Artwork } from '@/types';
import { ImageOff } from 'lucide-react';

interface GalleryProps {
  onSelect: (artwork: Artwork) => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${mins}`;
}

export function Gallery({ onSelect }: GalleryProps) {
  const artworks = useAppStore((s) => s.artworks);

  return (
    <div className="gallery-wrapper">
      <div className="gallery-header">
        <div className="gallery-title">
          <span>画廊</span>
          {artworks.length > 0 && (
            <span className="gallery-count">{artworks.length}</span>
          )}
        </div>
      </div>

      {artworks.length === 0 ? (
        <div className="gallery-empty">
          <ImageOff size={14} strokeWidth={1.5} />
          <span>暂无作品，开始你的第一次创作吧</span>
        </div>
      ) : (
        <div className="gallery-scroll">
          {artworks.map((a) => (
            <div
              key={a.id}
              className="artwork-card"
              onClick={() => onSelect(a)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect(a);
              }}
            >
              <img
                src={a.thumbnail}
                alt={`作品 ${a.shareCode}`}
                className="artwork-thumb"
                draggable={false}
              />
              <div className="artwork-card-overlay">
                <span className="artwork-code">{a.shareCode}</span>
                <span className="artwork-date">{formatDate(a.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
