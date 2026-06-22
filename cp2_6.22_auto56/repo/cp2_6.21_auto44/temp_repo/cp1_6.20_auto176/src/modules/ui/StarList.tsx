import React, { useState } from 'react';
import { Star, SPECTRAL_COLORS, SpectralType } from '../scene/StarData';
import { SavedConstellation } from '../scene/ConstellationSystem';

interface StarListProps {
  stars: Star[];
  highlightedStarId: string | null;
  onStarClick: (starId: string) => void;
  magnitudeRange: [number, number];
  spectralFilters: SpectralType[];
  savedConstellations: SavedConstellation[];
  onSaveConstellation: () => void;
  onLoadConstellation: (id: string) => void;
}

const StarList: React.FC<StarListProps> = ({
  stars,
  highlightedStarId,
  onStarClick,
  magnitudeRange,
  spectralFilters,
  savedConstellations,
  onSaveConstellation,
  onLoadConstellation,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const filteredStars = stars.filter(star => {
    const inMagnitudeRange = 
      star.magnitude >= magnitudeRange[0] && star.magnitude <= magnitudeRange[1];
    const inSpectralType = spectralFilters.includes(star.spectralType);
    return inMagnitudeRange && inSpectralType;
  });

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const sidebarContent = (
    <>
      <div className="sidebar-header">
        <h3>恒星列表 ({filteredStars.length})</h3>
        <button 
          className="toggle-btn" 
          onClick={() => {
            setIsCollapsed(!isCollapsed);
            setIsMobileOpen(false);
          }}
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>
      <div className={`sidebar-content ${isCollapsed ? 'collapsed' : ''}`}>
        <ul className="star-list">
          {filteredStars.map(star => (
            <li
              key={star.id}
              className={`star-item ${highlightedStarId === star.id ? 'highlighted' : ''}`}
              onClick={() => onStarClick(star.id)}
            >
              <div className="star-info">
                <span
                  className="star-dot"
                  style={{ backgroundColor: SPECTRAL_COLORS[star.spectralType] }}
                />
                <span className="star-name">{star.name}</span>
              </div>
              <div className="star-details">
                <span>{star.magnitude.toFixed(2)}m</span>
                <span>{star.spectralType}型</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="saved-constellations">
          <h4>已保存星座</h4>
          <button className="action-btn primary" onClick={onSaveConstellation}>
            保存星座
          </button>
          {savedConstellations.map(constellation => (
            <div
              key={constellation.id}
              className="constellation-item"
              onClick={() => onLoadConstellation(constellation.id)}
            >
              <div className="constellation-time">
                {formatTimestamp(constellation.timestamp)}
              </div>
              <div className="constellation-count">
                {constellation.lineCount} 条连线
              </div>
            </div>
          ))}
          {savedConstellations.length === 0 && (
            <div style={{ fontSize: '11px', color: '#8b949e', textAlign: 'center' }}>
              暂无保存的星座
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="star-sidebar">
        {sidebarContent}
      </div>

      <div className={`mobile-sidebar-overlay ${isMobileOpen ? 'open' : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />
      
      <div className={`mobile-sidebar ${isMobileOpen ? 'open' : ''}`}>
        {sidebarContent}
      </div>

      <div className="mobile-bottom-bar">
        <button onClick={() => setIsMobileOpen(!isMobileOpen)}>
          恒星列表
        </button>
      </div>
    </>
  );
};

export default StarList;
