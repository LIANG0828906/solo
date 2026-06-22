import React, { useState, useEffect } from 'react';
import NoteBubble from './NoteBubble';
import type { Photo } from '../types';
import { formatDate } from '../utils/dateUtils';
import './PhotoCard.css';

interface PhotoCardProps {
  photo: Photo;
  isVisible: boolean;
  index: number;
}

const PhotoCard: React.FC<PhotoCardProps> = ({ photo, isVisible, index }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showNote, setShowNote] = useState(false);

  useEffect(() => {
    if (isVisible && !showNote) {
      const timer = setTimeout(() => {
        setShowNote(true);
      }, 200 + index * 50);
      return () => clearTimeout(timer);
    }
  }, [isVisible, showNote, index]);

  const getStaggerClass = () => {
    const staggerIndex = (index % 8) + 1;
    return `stagger-${staggerIndex}`;
  };

  return (
    <div 
      className={`photo-card ${isVisible ? `animate-fade-in-up ${getStaggerClass()}` : ''}`}
    >
      <div className="photo-image-wrapper">
        {!imageLoaded && (
          <div className="photo-skeleton">
            <span className="skeleton-icon">🌿</span>
          </div>
        )}
        <img
          src={photo.imageUrl}
          alt={`记录于 ${formatDate(photo.date)}`}
          className={`photo-image ${imageLoaded ? 'loaded' : ''}`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
          draggable={false}
        />
      </div>
      
      <div className="photo-info">
        <div className="photo-date">{formatDate(photo.date)}</div>
        {photo.mood && (
          <span className="mood-tag pill-tag">{photo.mood}</span>
        )}
      </div>
      
      {photo.note && showNote && (
        <NoteBubble 
          note={photo.note} 
          delay={index * 100}
        />
      )}
    </div>
  );
};

export default React.memo(PhotoCard);
