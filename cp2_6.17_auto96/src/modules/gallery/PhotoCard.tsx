import React from 'react';
import type { Photo } from '../../types';

interface PhotoCardProps {
  photo: Photo;
  onClick: () => void;
}

const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#2D2D3F',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        transition: 'transform 0.25s ease-out, box-shadow 0.25s ease-out'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
      }}
    >
      <img
        src={photo.thumbnailUrl}
        alt={photo.title}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          objectFit: 'cover'
        }}
        loading="lazy"
      />
      <div style={{ padding: '12px' }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#ffffff',
          marginBottom: '4px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {photo.title}
        </h3>
        <p style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.6)',
          margin: 0
        }}>
          {photo.date}
        </p>
      </div>
    </div>
  );
};

export default PhotoCard;
