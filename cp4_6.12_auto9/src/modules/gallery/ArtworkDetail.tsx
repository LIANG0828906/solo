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
  const [showBuyForm, setShowBuyForm] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const navigate = useNavigate();
  const setIsDetailVisible = useGalleryStore((state) => state.setIsDetailVisible);

  useEffect(() => {
    setIsClosing(false);
  }, [artwork]);

  const handleClose = () => {
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

  return (
    <div className="detail-overlay" onClick={handleOverlayClick}>
      <div className={`detail-card ${isClosing ? 'closing' : ''}`} style={{ position: 'relative' }}>
        <button className="detail-close" onClick={handleClose}>
          ×
        </button>

        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="detail-card-image"
          style={{ filter: `hue-rotate(${artwork.hueShift}deg)` }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.background = '#E0E0D0';
          }}
        />

        <h2 className="detail-card-title">{artwork.title}</h2>
        <div className="detail-card-artist">{artwork.artistName}</div>

        <div className="detail-card-info">
          <span className="detail-card-label">创作年份</span>
          <span>{artwork.year}</span>
        </div>

        <div className="detail-card-info">
          <span className="detail-card-label">尺寸</span>
          <span>{artwork.width} × {artwork.height} cm</span>
        </div>

        <div className="detail-card-price">¥{artwork.price.toFixed(2)}</div>

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
