import { useState, useEffect } from 'react';
import { Product } from '../store';
import './ProductModal.css';

interface Props {
  product: Product;
  onClose: () => void;
  primaryColor?: string;
  accentColor?: string;
  visitorId: string;
  onFavoriteUpdate: (count: number) => void;
}

function ProductModal({ product, onClose, primaryColor = '#C0874E', accentColor = '#FF6B6B', visitorId, onFavoriteUpdate }: Props) {
  const [favorited, setFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(product.favorite_count);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleFavorite = async () => {
    if (favorited) return;

    try {
      const res = await fetch(`/api/product/${product.id}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId }),
      });
      const data = await res.json();
      if (data.favorited) {
        setFavorited(true);
        setFavoriteCount(data.favorite_count);
        onFavoriteUpdate(data.favorite_count);
      }
    } catch (err) {
      console.error('Favorite failed:', err);
    }
  };

  const handleContact = () => {
    handleClose();
  };

  return (
    <div
      className={`modal-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className={`modal-content ${isClosing ? 'closing' : ''}`}>
        <button className="modal-close" onClick={handleClose}>
          ✕
        </button>

        <div className="modal-image">
          <img src={product.image} alt={product.name} />
        </div>

        <div className="modal-body">
          <div className="modal-header-info">
            <span className="modal-category" style={{ backgroundColor: primaryColor }}>
              {product.category}
            </span>
            <h2 className="modal-title">{product.name}</h2>
            <p className="modal-price" style={{ color: accentColor }}>
              ¥{product.price}
            </p>
          </div>

          <div className="modal-description">
            <h4>商品描述</h4>
            <p>{product.description}</p>
          </div>

          <div className="modal-actions">
            <button
              className={`favorite-btn ${favorited ? 'favorited' : ''}`}
              onClick={handleFavorite}
            >
              <span className="heart">{favorited ? '❤️' : '🤍'}</span>
              <span>收藏 ({favoriteCount})</span>
            </button>
            <button
              className="contact-btn"
              style={{ backgroundColor: primaryColor }}
              onClick={handleContact}
            >
              💬 联系卖家
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductModal;
