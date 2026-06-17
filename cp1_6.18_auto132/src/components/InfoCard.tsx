import React from 'react';
import { Imagery } from '../stores/poemStore';
import './InfoCard.css';

interface InfoCardProps {
  imagery: Imagery;
  position: { x: number; y: number };
  onClose: () => void;
  onSelectPoem: (poem: string) => void;
}

const InfoCard: React.FC<InfoCardProps> = ({ imagery, position, onClose, onSelectPoem }) => {
  const cardStyle: React.CSSProperties = {
    left: Math.min(position.x + 15, window.innerWidth - 230),
    top: Math.min(position.y + 15, window.innerHeight - 400),
  };

  return (
    <div className="info-card" style={cardStyle}>
      <button className="info-card-close" onClick={onClose}>
        ×
      </button>
      <div className="info-card-header">
        <div className="info-card-author">{imagery.author}</div>
        <div className="info-card-source">{imagery.source}</div>
      </div>
      <div className="info-card-meaning">{imagery.meaning}</div>
      <div className="info-card-divider"></div>
      <div className="info-card-similar-title">相似诗句</div>
      <div className="info-card-similar-list">
        {imagery.similarPoems.map((poem, index) => (
          <div
            key={index}
            className="info-card-similar-item"
            onClick={() => onSelectPoem(poem)}
          >
            <span className="info-card-dot"></span>
            <span>{poem}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfoCard;
