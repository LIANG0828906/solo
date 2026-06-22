import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { BidPanel } from '../auction/BidPanel';
import { Timer } from '../auction/Timer';
import './ArtworkDetail.css';

const ArtworkDetail = () => {
  const { getSelectedArtwork, selectArtwork, getBidsForArtwork } = useStore();
  const artwork = getSelectedArtwork();
  const bids = artwork ? getBidsForArtwork(artwork.id) : [];
  const [showModal, setShowModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!artwork) return null;

  const formatTimeAgo = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return `${seconds}秒前`;
  };

  const getAvatarColor = (userId: string): string => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 60%, 70%)`;
  };

  const getInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={`detail-overlay ${isMounted ? 'show' : ''}`}>
      <div className="detail-container">
        <button className="close-button" onClick={() => selectArtwork(null)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {artwork.isEnded && artwork.winnerNickname && (
          <div className="winner-banner">
            🎉 恭喜 {artwork.winnerNickname} 以 ¥{artwork.currentPrice} 拍得此作品
          </div>
        )}

        <div className="detail-content">
          <div className="detail-image-section">
            <div
              className="detail-image-wrapper"
              onClick={() => setShowModal(true)}
            >
              <img
                src={artwork.imageUrl}
                alt={artwork.title}
                className="detail-image"
              />
              <div className="image-hint">点击查看大图</div>
            </div>
          </div>

          <div className="detail-info-section">
            <h1 className="detail-title">{artwork.title}</h1>
            <p className="detail-artist">by {artwork.artist}</p>
            <p className="detail-description">{artwork.description}</p>

            <div className="price-info">
              <div className="price-row">
                <span className="price-label">起拍价</span>
                <span className="start-price">¥{artwork.startingPrice}</span>
              </div>
              <div className="price-row">
                <span className="price-label">当前最高价</span>
                <span className="current-price">¥{artwork.currentPrice}</span>
              </div>
            </div>

            {!artwork.isEnded && <Timer artworkId={artwork.id} />}

            <BidPanel artworkId={artwork.id} />
          </div>
        </div>

        <div className="bid-history-section">
          <h2 className="section-title">出价历史</h2>
          <div className="bid-history-list">
            {bids.length === 0 ? (
              <p className="no-bids">暂无出价，快来成为第一位出价者吧！</p>
            ) : (
              bids.map((bid, index) => (
                <div key={bid.id} className="bid-record">
                  <div
                    className="bid-avatar"
                    style={{ backgroundColor: getAvatarColor(bid.userId) }}
                  >
                    {getInitial(bid.userNickname)}
                  </div>
                  <div className="bid-info">
                    <div className="bid-user">
                      {bid.userNickname}
                      {index === 0 && <span className="bid-leader">领先</span>}
                    </div>
                    <div className="bid-time">{formatTimeAgo(bid.timestamp)}</div>
                  </div>
                  <div className="bid-amount">¥{bid.amount}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {showModal && (
          <div className="image-modal" onClick={() => setShowModal(false)}>
            <img src={artwork.imageUrl} alt={artwork.title} className="modal-image" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtworkDetail;
