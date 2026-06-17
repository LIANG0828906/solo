import { memo } from 'react';
import type { Photo } from '../types';

interface AlbumCoverProps {
  photoCount: number;
  favoriteCount: number;
  isOpening: boolean;
  onOpen: () => void;
}

const AlbumCover = memo(function AlbumCover({
  photoCount,
  isOpening,
  onOpen
}: AlbumCoverProps) {
  return (
    <div
      className={`album-cover ${isOpening ? 'cover-opening' : ''}`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label="打开相册"
    >
      <div className="cover-subtitle">VINTAGE MEMORIES</div>
      <h1 className="cover-title">时光相册</h1>
      <div className="cover-decoration" />
      <div className="cover-photo-count">
        珍藏 <strong>{photoCount}</strong> 个瞬间
      </div>
      <div className="cover-hint">点击翻开相册 →</div>
    </div>
  );
});

export default AlbumCover;
export type { Photo };
