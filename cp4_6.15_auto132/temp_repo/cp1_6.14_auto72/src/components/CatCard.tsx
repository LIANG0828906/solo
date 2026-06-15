import React, { useRef, useState, useEffect } from 'react';
import type { Cat } from '../types';

interface CatCardProps {
  cat: Cat;
  onClick?: () => void;
  onDragStart?: (cat: Cat, e: React.MouseEvent | React.TouchEvent) => void;
  size?: 'small' | 'medium' | 'large';
  showStoryBubble?: boolean;
  isExamining?: boolean;
}

const CatCard: React.FC<CatCardProps> = ({
  cat,
  onClick,
  onDragStart,
  size = 'medium',
  showStoryBubble = false,
  isExamining = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showBubble, setShowBubble] = useState(false);

  const healthColor = {
    healthy: '#7CB342',
    mild: '#FFB74D',
    severe: '#EF5350',
  }[cat.healthStatus];

  const sizeStyles = {
    small: { width: 80, height: 100, fontSize: 11 },
    medium: { width: 100, height: 124, fontSize: 13 },
    large: { width: 120, height: 148, fontSize: 14 },
  }[size];

  const avatarSize = {
    small: 50,
    medium: 64,
    large: 80,
  }[size];

  const handleMouseDown = (e: React.MouseEvent) => {
    if (onDragStart) {
      e.preventDefault();
      onDragStart(cat, e);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (onDragStart) {
      e.preventDefault();
      onDragStart(cat, e);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`cat-card cat-card-${size} ${isExamining ? 'examining' : ''}`}
      style={{
        width: sizeStyles.width,
        height: sizeStyles.height,
        fontSize: sizeStyles.fontSize,
      }}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onMouseEnter={() => {
        setIsHovered(true);
        if (showStoryBubble) setShowBubble(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowBubble(false);
      }}
    >
      {showBubble && (
        <div className="story-bubble" onClick={e => e.stopPropagation()}>
          <div className="bubble-content">{cat.story}</div>
          <div className="bubble-arrow" />
        </div>
      )}

      <div
        className="cat-avatar-wrapper"
        style={{
          width: avatarSize,
          height: avatarSize,
        }}
      >
        <div
          className={`cat-avatar ${isHovered ? 'hovered' : ''}`}
          style={{
            fontSize: avatarSize * 0.6,
          }}
        >
          {cat.avatar}
        </div>

        {isExamining && (
          <>
            <div className="scanline" />
            <div className="exam-progress">
              <div
                className="exam-progress-fill"
                style={{ width: `${cat.examProgress || 0}%` }}
              />
            </div>
          </>
        )}

        <div
          className="health-dot"
          style={{ backgroundColor: healthColor }}
        />
      </div>

      <div className="cat-name" style={{ fontSize: sizeStyles.fontSize }}>
        {cat.name}
      </div>
    </div>
  );
};

export default CatCard;
