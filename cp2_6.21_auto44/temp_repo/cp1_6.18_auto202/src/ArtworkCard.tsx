import type { Seed } from './types/seed';
import './styles/ArtworkCard.css';

interface ArtworkCardProps {
  seed: Seed;
  onClose: () => void;
}

export default function ArtworkCard({ seed, onClose }: ArtworkCardProps) {
  return (
    <div className="artwork-card" role="dialog" aria-label={`作品信息：${seed.name}`}>
      <div className="artwork-header">
        <h2 className="artwork-title">{seed.name}</h2>
        <div className="artwork-author">{seed.author} 作品</div>
      </div>

      <div className="artwork-body">
        <p className="artwork-description">{seed.description}</p>
      </div>

      <div className="artwork-footer">
        <span className="artwork-date">{seed.createdAt}</span>
        <button
          className="artwork-close-btn"
          onClick={onClose}
          aria-label="关闭作品信息"
          title="关闭"
        >
          ×
        </button>
      </div>
    </div>
  );
}
