import React, { useEffect } from 'react';
import { Attraction } from '../types';
import { getGradientColors } from '../utils/hashColor';

interface AttractionModalProps {
  attraction: Attraction | null;
  onClose: () => void;
}

export const AttractionModal: React.FC<AttractionModalProps> = ({ attraction, onClose }) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!attraction) return null;

  const colors = getGradientColors(attraction.name);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="关闭">
          ×
        </button>
        <div
          className="modal-image"
          style={{
            background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
          }}
        >
          <div className="modal-image-label">{attraction.type}</div>
        </div>
        <div className="modal-body">
          <h2 className="modal-title">{attraction.name}</h2>
          <div className="modal-meta">
            <span className="modal-tag">{attraction.type}</span>
            <span className="modal-duration">{attraction.duration}</span>
          </div>
          <p className="modal-description">{attraction.description}</p>
          <div className="modal-time">
            <span className="time-icon">🕐</span>
            <span>建议到访时间：{attraction.time}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
