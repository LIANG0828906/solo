import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import type { Artwork } from '../layout/types';

const ArtworkPanel: React.FC = () => {
  const { artworks } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredArtworks = useMemo(() => {
    if (!searchTerm.trim()) return artworks;
    const term = searchTerm.toLowerCase();
    return artworks.filter(
      (a) =>
        a.name.toLowerCase().includes(term) ||
        a.tags.some((t) => t.toLowerCase().includes(term)) ||
        a.description.toLowerCase().includes(term)
    );
  }, [artworks, searchTerm]);

  const handleDragStart = (e: React.DragEvent, artwork: Artwork) => {
    e.dataTransfer.setData('artworkId', artwork.id);
    e.dataTransfer.effectAllowed = 'copy';
    const target = e.target as HTMLElement;
    target.style.opacity = '0.45';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
  };

  const getOrientationLabel = (orientation: string) => {
    switch (orientation) {
      case 'portrait':
        return '竖版';
      case 'landscape':
        return '横版';
      case 'square':
        return '方形';
      default:
        return orientation;
    }
  };

  return (
    <div className="artwork-panel">
      <div className="artwork-panel-header">
        <h2>展品库</h2>
      </div>
      <div className="artwork-panel-search">
        <input
          type="text"
          placeholder="搜索展品..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      <div className="artwork-list">
        {filteredArtworks.map((artwork) => (
          <div
            key={artwork.id}
            className="artwork-card"
            draggable
            onDragStart={(e) => handleDragStart(e, artwork)}
            onDragEnd={handleDragEnd}
          >
            <div className="artwork-thumbnail">
              <div className="thumbnail-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            </div>
            <div className="artwork-info">
              <div className="artwork-name">{artwork.name}</div>
              <div className="artwork-meta">
                <span className="artwork-size">
                  {artwork.width} × {artwork.height}
                </span>
                <span className={`artwork-orientation orientation-${artwork.orientation}`}>
                  {getOrientationLabel(artwork.orientation)}
                </span>
              </div>
            </div>
          </div>
        ))}
        {filteredArtworks.length === 0 && (
          <div className="empty-state">没有找到匹配的展品</div>
        )}
      </div>
    </div>
  );
};

export default ArtworkPanel;
