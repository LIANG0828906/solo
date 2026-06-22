import React, { useRef, useEffect, useState } from 'react';
import { useAppContext } from '../App';
import type { Plant } from '../types';
import './PlantCard.css';

interface PlantCardProps {
  plant: Plant;
  onContextMenu: (e: React.MouseEvent | React.TouchEvent) => void;
}

const healthColors: Record<string, string> = {
  healthy: 'var(--color-healthy)',
  normal: 'var(--color-normal)',
  attention: 'var(--color-attention)'
};

const healthLabels: Record<string, string> = {
  healthy: '健康',
  normal: '一般',
  attention: '需关注'
};

const PlantCard: React.FC<PlantCardProps> = ({ plant, onContextMenu }) => {
  const { navigate, getPlantAge } = useAppContext();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (!isLongPress) {
      navigate('detail', plant.id);
    }
    setIsLongPress(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      onContextMenu(e);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="plant-card glass-card"
      onClick={handleClick}
      onContextMenu={onContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      {plant.isFavorite && (
        <div className="favorite-badge">
          <span>⭐</span>
        </div>
      )}
      
      <div className="card-image-wrapper">
        {!imageLoaded && (
          <div className="image-skeleton">
            <span className="skeleton-icon">🌱</span>
          </div>
        )}
        <img
          src={plant.coverPhoto}
          alt={plant.name}
          className={`card-image ${imageLoaded ? 'loaded' : ''}`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        <div 
          className="health-indicator"
          style={{ backgroundColor: healthColors[plant.healthStatus] }}
          title={healthLabels[plant.healthStatus]}
        />
      </div>
      
      <div className="card-content">
        <div className="card-header">
          <h3 className="plant-name handwriting">{plant.name}</h3>
          <span className="age-tag pill-tag">
            {getPlantAge(plant.plantDate)}
          </span>
        </div>
        <p className="plant-variety">{plant.variety}</p>
        <div className="card-footer">
          <span 
            className="health-tag pill-tag"
            style={{
              backgroundColor: `${healthColors[plant.healthStatus]}20`,
              color: healthColors[plant.healthStatus]
            }}
          >
            {healthLabels[plant.healthStatus]}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlantCard;
