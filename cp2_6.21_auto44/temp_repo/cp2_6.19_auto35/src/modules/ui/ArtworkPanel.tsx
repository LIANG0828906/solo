import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import type { Artwork } from '../layout/types';

const ArtworkPanel: React.FC = () => {
  const { artworks, successfullyAdheredArtworkId } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const timerRef = useRef<number | null>(null);
  const prevDebouncedRef = useRef('');

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      prevDebouncedRef.current = debouncedSearchTerm;
      setDebouncedSearchTerm(searchTerm);
    }, 200);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [searchTerm, debouncedSearchTerm]);

  useEffect(() => {
    if (successfullyAdheredArtworkId) {
      setShowSuccess(true);
    }
  }, [successfullyAdheredArtworkId]);

  const filteredArtworks = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return artworks;
    const term = debouncedSearchTerm.toLowerCase();
    return artworks.filter(
      (a) =>
        a.name.toLowerCase().includes(term) ||
        a.tags.some((t) => t.toLowerCase().includes(term)) ||
        a.description.toLowerCase().includes(term)
    );
  }, [artworks, debouncedSearchTerm]);

  const handleDragStart = (e: React.DragEvent, artwork: Artwork) => {
    e.dataTransfer.setData('artworkId', artwork.id);
    e.dataTransfer.effectAllowed = 'copy';
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.45';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
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
        {searchTerm !== debouncedSearchTerm && (
          <div className="search-loading">
            <div className="search-spinner" />
          </div>
        )}
      </div>
      <div className="artwork-list">
        {filteredArtworks.map((artwork) => (
          <div
            key={artwork.id}
            className={`artwork-card ${showSuccess && successfullyAdheredArtworkId === artwork.id ? 'adhere-success' : ''}`}
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
              {showSuccess && successfullyAdheredArtworkId === artwork.id && (
                <div className="adhere-success-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
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
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <span>没有找到匹配的展品</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtworkPanel;
