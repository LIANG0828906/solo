import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Artwork, User } from '../types';

function Detail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [showHeartParticles, setShowHeartParticles] = useState(false);
  const [likes, setLikes] = useState(0);

  // 轮播拖拽状态
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [fadeTransition, setFadeTransition] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('museum_user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    fetchArtwork();
  }, [id]);

  useEffect(() => {
    if (user && artwork) {
      checkFavorite();
    }
  }, [user, artwork]);

  const fetchArtwork = async () => {
    try {
      const { data } = await api.get(`/artworks/${id}`);
      setArtwork(data);
      setLikes(data.likes);
    } catch (error) {
      console.error('Failed to fetch artwork:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const { data } = await api.get('/favorites/check', {
        params: { userId: user!.id, artworkId: id }
      });
      setIsFavorited(data.isFavorite);
      if (data.favorite) {
        setFavoriteId(data.favorite.id);
      }
    } catch (error) {
      console.error('Failed to check favorite:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('请先登录');
      return;
    }
    try {
      const { data } = await api.post(`/artworks/${id}/like`);
      setLikes(data.likes);
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      alert('请先登录');
      return;
    }
    try {
      if (isFavorited) {
        await api.delete(`/favorites/${favoriteId}`);
        setIsFavorited(false);
      } else {
        const { data } = await api.post('/favorites', {
          userId: user.id,
          artworkId: id
        });
        setIsFavorited(true);
        setFavoriteId(data.id);
        setShowHeartParticles(true);
        setTimeout(() => setShowHeartParticles(false), 800);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      alert('请先登录');
      return;
    }
    try {
      await api.post('/purchases', {
        userId: user.id,
        artworkId: id
      });
      setPurchaseSuccess(true);
    } catch (error) {
      console.error('Failed to purchase:', error);
    }
  };

  // 轮播拖拽逻辑
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setDragOffset(0);
    setFadeTransition(false);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - startX;
    setDragOffset(diff);
  }, [isDragging, startX]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setFadeTransition(true);

    const threshold = 80;
    const elasticResistance = 0.3;

    if (dragOffset > threshold) {
      if (currentImage > 0) {
        setCurrentImage(currentImage - 1);
      }
    } else if (dragOffset < -threshold) {
      if (currentImage < artwork!.images.length - 1) {
        setCurrentImage(currentImage + 1);
      }
    }

    setDragOffset(0);
  }, [isDragging, dragOffset, currentImage, artwork]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setFadeTransition(true);
      setDragOffset(0);
    }
  }, [isDragging]);

  // 触摸支持
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setDragOffset(0);
    setFadeTransition(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX;
    setDragOffset(diff);
  }, [isDragging, startX]);

  const handleTouchEnd = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  const getImageTransform = () => {
    if (!fadeTransition && isDragging) {
      const elasticResistance = 0.3;
      let offset = dragOffset;
      if ((currentImage === 0 && dragOffset > 0) || 
          (artwork && currentImage === artwork.images.length - 1 && dragOffset < 0)) {
        offset = dragOffset * elasticResistance;
      }
      return `translateX(${offset}px)`;
    }
    return 'translateX(0)';
  };

  if (loading) {
    return (
      <div className="detail-overlay" onClick={() => navigate(-1)}>
        <div className="detail-modal loading-modal">
          <div className="skeleton" style={{ width: '100%', height: '400px', borderRadius: '12px 12px 0 0' }} />
          <div style={{ padding: '24px' }}>
            <div className="skeleton" style={{ width: '60%', height: '24px', marginBottom: '16px' }} />
            <div className="skeleton" style={{ width: '100%', height: '80px', marginBottom: '16px' }} />
            <div className="skeleton" style={{ width: '40%', height: '20px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="detail-overlay" onClick={() => navigate(-1)}>
        <div className="detail-modal">
          <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>作品不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-overlay" onClick={() => navigate(-1)}>
      <div className="detail-modal slide-up" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={() => navigate(-1)}>
          ×
        </button>

        {/* 照片轮播 */}
        <div 
          className="carousel-container"
          ref={carouselRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="carousel-track"
            style={{ 
              transform: getImageTransform(),
              transition: fadeTransition ? 'transform 0.3s ease' : 'none',
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
          >
            <div className="carousel-slide">
              <img 
                src={artwork.images[currentImage]} 
                alt={artwork.name}
                className="carousel-image"
                style={{ 
                  opacity: fadeTransition ? 1 : 1,
                  transition: 'opacity 0.3s ease'
                }}
              />
            </div>
          </div>

          {/* 左右箭头 */}
          {currentImage > 0 && (
            <button 
              className="carousel-arrow prev"
              onClick={(e) => { e.stopPropagation(); setCurrentImage(currentImage - 1); }}
            >
              ‹
            </button>
          )}
          {currentImage < artwork.images.length - 1 && (
            <button 
              className="carousel-arrow next"
              onClick={(e) => { e.stopPropagation(); setCurrentImage(currentImage + 1); }}
            >
              ›
            </button>
          )}

          {/* 缩略图指示器 */}
          <div className="carousel-indicators">
            {artwork.images.map((_, idx) => (
              <button
                key={idx}
                className={`indicator ${idx === currentImage ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setCurrentImage(idx); }}
              />
            ))}
          </div>

          {/* 照片网格缩略图 */}
          <div className="thumbnail-strip">
            {artwork.images.map((img, idx) => (
              <div
                key={idx}
                className={`thumbnail ${idx === currentImage ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setCurrentImage(idx); }}
              >
                <img src={img} alt="" />
              </div>
            ))}
          </div>
        </div>

        {/* 作品信息 */}
        <div className="detail-content">
          <div className="detail-header">
            <h1 className="detail-title">{artwork.name}</h1>
            <div className="detail-meta">
              <span className="material-tag">{artwork.material}</span>
              <span className="like-badge" onClick={handleLike}>
                ❤️ {likes}
              </span>
            </div>
          </div>

          <div className="detail-price">
            <span className="price-symbol">¥</span>
            <span className="price-value">{artwork.price}</span>
          </div>

          <div className="detail-section">
            <h3 className="section-title">作品描述</h3>
            <p className="section-text">{artwork.description}</p>
          </div>

          <div className="detail-section">
            <h3 className="section-title">规格参数</h3>
            <div className="spec-grid">
              <div className="spec-item">
                <span className="spec-label">尺寸</span>
                <span className="spec-value">{artwork.dimensions}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">材质</span>
                <span className="spec-value">{artwork.material}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3 className="section-title">卖家信息</h3>
            <div className="seller-info">
              <div className="seller-avatar">{artwork.sellerName.charAt(0)}</div>
              <div>
                <div className="seller-name">{artwork.sellerName}</div>
                <div className="seller-badge">认证匠人</div>
              </div>
            </div>
          </div>

          {/* 底部操作按钮 */}
          <div className="detail-actions">
            <button
              className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
              onClick={handleFavorite}
              style={{ position: 'relative', overflow: 'visible' }}
            >
              {isFavorited ? '❤️ 已收藏' : '🤍 收藏'}
              {showHeartParticles && <HeartParticles />}
            </button>
            <button className="purchase-btn btn-gold" onClick={() => setShowPurchaseModal(true)}>
              立即购买
            </button>
          </div>
        </div>

        {/* 购买确认弹窗 */}
        {showPurchaseModal && (
          <div className="purchase-modal-overlay" onClick={() => setShowPurchaseModal(false)}>
            <div className="purchase-modal bounce-in" onClick={e => e.stopPropagation()}>
              {purchaseSuccess ? (
                <>
                  <div className="success-icon">✓</div>
                  <h3 className="purchase-modal-title">购买成功！</h3>
                  <p className="purchase-modal-text">
                    感谢您的购买，卖家将在24小时内与您联系确认发货事宜。
                  </p>
                  <button 
                    className="btn-gold" 
                    style={{ width: '100%', marginTop: '20px' }}
                    onClick={() => { setShowPurchaseModal(false); setPurchaseSuccess(false); }}
                  >
                    确定
                  </button>
                </>
              ) : (
                <>
                  <h3 className="purchase-modal-title">确认购买</h3>
                  <div className="purchase-product">
                    <img src={artwork.images[0]} alt="" className="purchase-thumb" />
                    <div className="purchase-info">
                      <div className="purchase-name">{artwork.name}</div>
                      <div className="purchase-price">¥{artwork.price}</div>
                    </div>
                  </div>
                  <div className="purchase-row">
                    <span>商品金额</span>
                    <span>¥{artwork.price}</span>
                  </div>
                  <div className="purchase-row">
                    <span>运费</span>
                    <span>¥0</span>
                  </div>
                  <div className="purchase-row total">
                    <span>实付金额</span>
                    <span>¥{artwork.price}</span>
                  </div>
                  <div className="purchase-actions">
                    <button className="btn-outline" onClick={() => setShowPurchaseModal(false)}>
                      取消
                    </button>
                    <button className="btn-gold" onClick={handlePurchase}>
                      确认支付
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <style>{`
          .detail-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            z-index: 200;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            animation: fadeIn 0.3s ease;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .detail-modal {
            width: 100%;
            max-width: 900px;
            height: 80vh;
            background: var(--bg-primary);
            border-radius: 16px 16px 0 0;
            overflow-y: auto;
            position: relative;
            animation: slideUp 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }
          .slide-up {
            animation: slideUp 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .close-btn {
            position: absolute;
            top: 16px;
            right: 20px;
            z-index: 10;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(0,0,0,0.5);
            color: white;
            font-size: 24px;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
          }
          .carousel-container {
            position: relative;
            width: 100%;
            background: var(--bg-secondary);
            user-select: none;
          }
          .carousel-track {
            display: flex;
            width: 100%;
          }
          .carousel-slide {
            flex: 0 0 100%;
            width: 100%;
          }
          .carousel-image {
            width: 100%;
            height: 350px;
            object-fit: cover;
            pointer-events: none;
          }
          .carousel-arrow {
            position: absolute;
            top: 40%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(0,0,0,0.4);
            color: white;
            border: none;
            font-size: 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
            z-index: 5;
          }
          .carousel-arrow:hover {
            background: rgba(0,0,0,0.6);
          }
          .carousel-arrow.prev { left: 16px; }
          .carousel-arrow.next { right: 16px; }
          .carousel-indicators {
            position: absolute;
            top: 300px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            z-index: 5;
          }
          .indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: rgba(255,255,255,0.4);
            border: none;
            cursor: pointer;
            transition: all 0.2s;
          }
          .indicator.active {
            background: var(--accent-gold);
            width: 24px;
            border-radius: 4px;
          }
          .thumbnail-strip {
            display: flex;
            gap: 8px;
            padding: 12px 16px;
            overflow-x: auto;
            background: var(--bg-secondary);
          }
          .thumbnail {
            flex: 0 0 60px;
            height: 60px;
            border-radius: 6px;
            overflow: hidden;
            cursor: pointer;
            opacity: 0.6;
            transition: opacity 0.2s;
            border: 2px solid transparent;
          }
          .thumbnail.active {
            opacity: 1;
            border-color: var(--accent-gold);
          }
          .thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .detail-content {
            padding: 24px 28px 32px;
          }
          .detail-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
          }
          .detail-title {
            font-size: 24px;
            font-weight: 700;
            color: var(--text-primary);
          }
          .detail-meta {
            display: flex;
            gap: 10px;
            align-items: center;
          }
          .material-tag {
            background: rgba(212, 160, 23, 0.15);
            color: var(--accent-gold);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
          }
          .like-badge {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            background: var(--card-bg);
            border-radius: 20px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
          }
          .like-badge:hover {
            transform: scale(1.05);
          }
          .detail-price {
            display: flex;
            align-items: baseline;
            gap: 4px;
            margin-bottom: 24px;
          }
          .price-symbol {
            font-size: 20px;
            color: var(--accent-gold);
            font-weight: 600;
          }
          .price-value {
            font-size: 36px;
            color: var(--accent-gold);
            font-weight: 700;
          }
          .detail-section {
            margin-bottom: 24px;
          }
          .section-title {
            font-size: 15px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 10px;
          }
          .section-text {
            font-size: 14px;
            color: var(--text-secondary);
            line-height: 1.8;
          }
          .spec-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .spec-item {
            display: flex;
            justify-content: space-between;
            padding: 12px 16px;
            background: var(--card-bg);
            border-radius: 8px;
            backdrop-filter: blur(8px);
          }
          .spec-label {
            font-size: 13px;
            color: var(--text-muted);
          }
          .spec-value {
            font-size: 13px;
            color: var(--text-primary);
            font-weight: 500;
          }
          .seller-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .seller-avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark));
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--bg-primary);
            font-weight: 700;
            font-size: 18px;
          }
          .seller-name {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 2px;
          }
          .seller-badge {
            font-size: 11px;
            color: var(--accent-gold);
          }
          .detail-actions {
            display: flex;
            gap: 12px;
            margin-top: 28px;
          }
          .favorite-btn {
            flex: 1;
            padding: 12px 20px;
            border-radius: 8px;
            border: 1px solid var(--card-border);
            background: transparent;
            color: var(--text-primary);
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
          .favorite-btn:hover {
            border-color: var(--accent-gold);
            transform: translateY(-2px);
          }
          .favorite-btn.favorited {
            background: rgba(239, 68, 68, 0.1);
            border-color: var(--error);
            color: var(--error);
          }
          .purchase-btn {
            flex: 2;
            padding: 12px 20px;
            font-size: 15px;
          }
          .purchase-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.7);
            z-index: 300;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease;
          }
          .purchase-modal {
            background: var(--bg-secondary);
            border-radius: 12px;
            padding: 28px;
            width: 90%;
            max-width: 420px;
            border: 1px solid var(--card-border);
          }
          .bounce-in {
            animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }
          @keyframes bounceIn {
            0% { opacity: 0; transform: scale(0.8); }
            60% { opacity: 1; transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          .purchase-modal-title {
            font-size: 20px;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 20px;
            text-align: center;
          }
          .purchase-modal-text {
            font-size: 14px;
            color: var(--text-secondary);
            text-align: center;
            line-height: 1.6;
          }
          .purchase-product {
            display: flex;
            gap: 12px;
            padding: 12px;
            background: var(--card-bg);
            border-radius: 8px;
            margin-bottom: 16px;
          }
          .purchase-thumb {
            width: 60px;
            height: 60px;
            border-radius: 6px;
            object-fit: cover;
          }
          .purchase-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .purchase-name {
            font-size: 14px;
            color: var(--text-primary);
            margin-bottom: 4px;
          }
          .purchase-price {
            font-size: 16px;
            color: var(--accent-gold);
            font-weight: 600;
          }
          .purchase-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 13px;
            color: var(--text-secondary);
          }
          .purchase-row.total {
            border-top: 1px solid var(--card-border);
            padding-top: 12px;
            margin-top: 8px;
            font-size: 15px;
            font-weight: 600;
            color: var(--accent-gold);
          }
          .purchase-actions {
            display: flex;
            gap: 12px;
            margin-top: 20px;
          }
          .purchase-actions button {
            flex: 1;
          }
          .success-icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #22C55E, #16A34A);
            color: white;
            font-size: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }
          .loading-modal {
            pointer-events: none;
          }
          @media (max-width: 768px) {
            .detail-modal {
              height: 90vh;
            }
            .carousel-image {
              height: 280px;
            }
            .carousel-indicators {
              top: 230px;
            }
            .detail-title {
              font-size: 20px;
            }
            .price-value {
              font-size: 28px;
            }
            .spec-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

function HeartParticles() {
  const hearts = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    left: 30 + Math.random() * 40,
    delay: Math.random() * 0.2,
    size: 14 + Math.random() * 12,
  }));

  return (
    <div style={{ 
      position: 'absolute', 
      inset: 0, 
      pointerEvents: 'none',
      overflow: 'visible'
    }}>
      {hearts.map(heart => (
        <span
          key={heart.id}
          style={{
            position: 'absolute',
            left: `${heart.left}%`,
            top: '50%',
            fontSize: `${heart.size}px`,
            animation: `floatUp 0.8s ease-out ${heart.delay}s forwards`,
            opacity: 0,
          }}
        >
          ❤️
        </span>
      ))}
      <style>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(0.5);
          }
          50% {
            opacity: 1;
            transform: translateY(-30px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translateY(-60px) scale(0.8);
          }
        }
      `}</style>
    </div>
  );
}

export default Detail;
