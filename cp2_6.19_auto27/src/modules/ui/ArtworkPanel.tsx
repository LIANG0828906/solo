import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Artwork } from '../layout/types';

interface ArtworkPanelProps {
  onDragStart: (artwork: Artwork, e: React.MouseEvent) => void;
}

export const ArtworkPanel: React.FC<ArtworkPanelProps> = ({ onDragStart }) => {
  const { artworks, searchQuery, setSearchQuery } = useStore();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const filteredArtworks = useMemo(() => {
    if (!searchQuery.trim()) return artworks;
    const query = searchQuery.toLowerCase();
    return artworks.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.tags.some((t) => t.toLowerCase().includes(query))
    );
  }, [artworks, searchQuery]);

  const handleMouseDown = (artwork: Artwork, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingId(artwork.id);
    onDragStart(artwork, e);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setDraggingId(null);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const getOrientationLabel = (orientation: Artwork['orientation']) => {
    switch (orientation) {
      case 'portrait':
        return '竖版';
      case 'landscape':
        return '横版';
      case 'square':
        return '方形';
    }
  };

  return (
    <div 
      ref={panelRef}
      className="artwork-panel"
      style={{
        width: 220,
        backgroundColor: '#3A3A3A',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRight: '1px solid #2A2A2A',
      }}
    >
      <div
        style={{
          padding: '16px 12px',
          borderBottom: '1px solid #2A2A2A',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: '#E0E0E0',
            marginBottom: 12,
          }}
        >
          展品库
        </h2>
        <input
          type="text"
          placeholder="搜索展品..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #555',
            borderRadius: 6,
            backgroundColor: '#2A2A2A',
            color: '#E0E0E0',
            fontSize: 12,
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#4A90D9';
            e.target.style.boxShadow = '0 0 0 2px rgba(74, 144, 217, 0.2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#555';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {filteredArtworks.length === 0 ? (
          <div
            style={{
              color: '#888',
              fontSize: 12,
              textAlign: 'center',
              padding: '20px 0',
            }}
          >
            未找到匹配的展品
          </div>
        ) : (
          filteredArtworks.map((artwork) => (
            <div
              key={artwork.id}
              draggable
              onMouseDown={(e) => handleMouseDown(artwork, e)}
              style={{
                backgroundColor: '#2A2A2A',
                borderRadius: 8,
                padding: 10,
                cursor: draggingId === artwork.id ? 'grabbing' : 'grab',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                transition: 'box-shadow 0.2s, transform 0.2s',
                opacity: draggingId === artwork.id ? 0.45 : 1,
                userSelect: 'none',
              }}
              onMouseEnter={(e) => {
                if (draggingId !== artwork.id) {
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(0, 0, 0, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  '0 1px 3px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: 60,
                  backgroundColor: '#444',
                  borderRadius: 4,
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#888',
                  fontSize: 11,
                  backgroundImage: artwork.thumbnail
                    ? `url(${artwork.thumbnail})`
                    : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!artwork.thumbnail && '展品图片'}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#E0E0E0',
                  marginBottom: 4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {artwork.name}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 10,
                  color: '#999',
                }}
              >
                <span>
                  {artwork.width} × {artwork.height}
                </span>
                <span
                  style={{
                    backgroundColor: '#4A90D9',
                    color: '#fff',
                    padding: '1px 6px',
                    borderRadius: 3,
                    fontSize: 9,
                  }}
                >
                  {getOrientationLabel(artwork.orientation)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
