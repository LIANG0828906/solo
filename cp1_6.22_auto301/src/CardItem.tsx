import React, { memo } from 'react';
import type { Postcard } from './types';

interface CardItemProps {
  postcard: Postcard;
  selected: boolean;
  onClick: (id: string) => void;
}

const CardItem: React.FC<CardItemProps> = memo(function CardItem({ postcard, selected, onClick }) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(postcard.id);
  };

  const cardStyle: React.CSSProperties = {
    position: 'absolute',
    left: postcard.x,
    top: postcard.y,
    width: postcard.width,
    height: postcard.height,
    backgroundColor: '#FDF5E6',
    border: `2px solid ${selected ? '#8B4513' : '#D2B48C'}`,
    borderRadius: '12px',
    boxShadow: selected
      ? '8px 8px 20px rgba(0,0,0,0.25)'
      : '4px 4px 12px rgba(0,0,0,0.1)',
    transform: `rotate(${postcard.rotation}deg) ${selected ? 'scale(1.05)' : ''}`,
    transformOrigin: 'center center',
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    zIndex: selected ? 10 : 1,
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '200px',
    backgroundColor: postcard.imageUrl,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  const textContainerStyle: React.CSSProperties = {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#3E2723',
    margin: 0,
    lineHeight: 1.3,
  };

  const locationStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6D4C41',
    margin: 0,
  };

  const dateStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#8D6E63',
    margin: 0,
  };

  const hoverStyle: React.CSSProperties = {
    ':hover': {
      transform: `rotate(${postcard.rotation + 2}deg) translateY(-4px) ${selected ? 'scale(1.05)' : ''}`,
      boxShadow: selected ? '8px 8px 20px rgba(0,0,0,0.25)' : '6px 6px 16px rgba(0,0,0,0.15)',
    },
  };

  return (
    <div
      style={{
        ...cardStyle,
        ...(hoverStyle as React.CSSProperties),
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.transform = `rotate(${postcard.rotation + 2}deg) translateY(-4px)`;
          e.currentTarget.style.boxShadow = '6px 6px 16px rgba(0,0,0,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.transform = `rotate(${postcard.rotation}deg)`;
          e.currentTarget.style.boxShadow = '4px 4px 12px rgba(0,0,0,0.1)';
        }
      }}
    >
      <div style={imageStyle} />
      <div style={textContainerStyle}>
        <h3 style={titleStyle}>{postcard.title}</h3>
        <p style={locationStyle}>{postcard.location}</p>
        <p style={dateStyle}>{postcard.date}</p>
      </div>
    </div>
  );
});

export default CardItem;
