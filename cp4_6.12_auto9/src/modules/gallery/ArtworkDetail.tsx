import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Artwork } from '../../types';
import { useGalleryStore } from '../../store';

interface ArtworkDetailProps {
  artwork: Artwork;
  onClose: () => void;
}

const ArtworkDetail: React.FC<ArtworkDetailProps> = ({ artwork, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showBuyForm, setShowBuyForm] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const navigate = useNavigate();
  const setIsDetailVisible = useGalleryStore((state) => state.setIsDetailVisible);

  useEffect(() => {
    setIsClosing(false);
    setShowBuyForm(false);
    setBuyerName('');
    setBuyerEmail('');
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, [artwork]);

  const handleClose = () => {
    setIsVisible(false);
    setIsClosing(true);
    setTimeout(() => {
      setIsDetailVisible(false);
      onClose();
    }, 300);
  };

  const handleBuy = () => {
    setShowBuyForm(true);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/orders', {
        artworkId: artwork.id,
        buyerName,
        buyerEmail,
      });
      handleClose();
      navigate('/orders');
    } catch (error) {
      console.error('创建订单失败:', error);
      alert('创建订单失败，请重试');
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
    background: 'rgba(0, 0, 0, 0.3)',
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out',
  };

  const cardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    padding: '24px',
    width: '360px',
    maxWidth: '90vw',
    pointerEvents: 'auto',
    transform: isClosing ? 'scale(0.8)' : 'scale(1)',
    opacity: isClosing ? 0 : 1,
    transition: isClosing
      ? 'all 0.3s ease-in'
      : 'all 0.3s ease-out',
    position: 'relative',
  };

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div style={cardStyle}>
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '16px',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666',
            transition: 'color 0.2s ease',
            background: 'none',
            border: 'none',
            padding: 0,
            lineHeight: 1,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#333')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
        >
          ×
        </button>

        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            borderRadius: '6px',
            marginBottom: '16px',
            filter: `hue-rotate(${artwork.hueShift}deg)`,
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.background = '#E0E0D0';
          }}
        />

        <h2
          style={{
            fontSize: '22px',
            fontWeight: 600,
            marginBottom: '8px',
            color: '#333',
          }}
        >
          {artwork.title}
        </h2>
        <div
          style={{
            fontSize: '14px',
            color: '#666',
            marginBottom: '12px',
          }}
        >
          {artwork.artistName}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '14px',
            marginBottom: '6px',
          }}
        >
          <span style={{ color: '#666' }}>创作年份</span>
          <span style={{ color: '#333' }}>{artwork.year}</span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '14px',
            marginBottom: '6px',
          }}
        >
          <span style={{ color: '#666' }}>尺寸</span>
          <span style={{ color: '#333' }}>
            {artwork.width} × {artwork.height} cm
          </span>
        </div>

        <div
          style={{
            fontSize: '28px',
            fontWeight: 600,
            color: '#A67C52',
            margin: '16px 0',
          }}
        >
          ¥{artwork.price.toFixed(2)}
        </div>

        {!showBuyForm ? (
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={handleBuy}
          >
            立即购买
          </button>
        ) : (
          <form onSubmit={handleSubmitOrder}>
            <div className="form-group">
              <label className="form-label">您的姓名</label>
              <input
                type="text"
                className="form-input"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="请输入姓名"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">电子邮箱</label>
              <input
                type="email"
                className="form-input"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="请输入邮箱"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              确认购买意向
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ArtworkDetail;
