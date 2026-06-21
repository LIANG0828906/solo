import React, { useState } from 'react';
import { MenuItem } from '../../context/MenuContext';
import ImageModal from '../common/ImageModal';

interface Props {
  item: MenuItem;
  onAddToCart: () => void;
}

const MenuCard: React.FC<Props> = ({ item, onAddToCart }) => {
  const [showImage, setShowImage] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const cardStyle: React.CSSProperties = {
    width: '340px',
    maxWidth: '100%',
    background: '#FDF2F8',
    borderRadius: '16px',
    border: '0.5px solid #E5E7EB',
    padding: '20px',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
    boxShadow: isHovered
      ? '0 12px 32px rgba(245, 158, 11, 0.2), 0 4px 12px rgba(0,0,0,0.08)'
      : '0 2px 8px rgba(0,0,0,0.04)',
    cursor: 'default',
  };

  const imageWrapStyle: React.CSSProperties = {
    width: '100%',
    marginBottom: '16px',
    borderRadius: '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    background: '#F3F4F6',
  };

  const imageStyle: React.CSSProperties = {
    width: '120px',
    height: '120px',
    objectFit: 'cover',
    borderRadius: '12px',
    display: 'block',
    margin: '0 auto',
    border: '2px solid #FFFFFF',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  };

  const nameStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    color: '#1F2937',
    marginBottom: '8px',
    lineHeight: 1.4,
  };

  const priceStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 800,
    color: '#EF4444',
    marginBottom: '12px',
  };

  const descStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#6B7280',
    lineHeight: 1.6,
    marginBottom: '16px',
    minHeight: '42px',
  };

  const timeBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'rgba(245, 158, 11, 0.15)',
    color: '#F59E0B',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '16px',
    border: '1px solid #F59E0B',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    background: '#F59E0B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={imageWrapStyle} onClick={() => setShowImage(true)}>
        <img
          src={item.image}
          alt={item.name}
          style={imageStyle}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop';
          }}
        />
      </div>

      <h3 style={nameStyle}>{item.name}</h3>
      <div style={priceStyle}>¥{item.price.toFixed(2)}</div>
      <p style={descStyle}>{item.description}</p>

      <div style={timeBadgeStyle}>
        ⏰ 特价时段：{item.startTime} - {item.endTime}
      </div>

      <button
        style={buttonStyle}
        onClick={onAddToCart}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#D97706';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#F59E0B';
        }}
      >
        <span>➕</span>
        <span>加入购物车</span>
      </button>

      {showImage && (
        <ImageModal
          src={item.image}
          alt={item.name}
          onClose={() => setShowImage(false)}
        />
      )}
    </div>
  );
};

export default MenuCard;
