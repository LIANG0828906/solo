import React from 'react';
import type { StarData } from '@/types';

interface StarCardProps {
  star: StarData;
  onDragStart: (e: React.DragEvent, star: StarData) => void;
  onBrightnessChange: (id: string, brightness: number) => void;
}

const StarCard: React.FC<StarCardProps> = ({ star, onDragStart, onBrightnessChange }) => {
  return (
    <div
      className="star-card"
      draggable
      onDragStart={(e) => onDragStart(e, star)}
      style={
        {
          '--star-color': star.color,
        } as React.CSSProperties
      }
    >
      <div className="star-card__preview">
        <div
          className="star-card__color-dot"
          style={{ backgroundColor: star.color }}
        />
      </div>
      <div className="star-card__info">
        <span className="star-card__name">{star.name}</span>
        <div className="star-card__slider-row">
          <span className="star-card__slider-label">亮度</span>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={star.brightness}
            onChange={(e) => onBrightnessChange(star.id, parseFloat(e.target.value))}
            className="star-card__slider"
          />
        </div>
      </div>
    </div>
  );
};

export default StarCard;
