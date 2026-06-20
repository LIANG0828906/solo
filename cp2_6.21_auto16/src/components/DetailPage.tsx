import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import * as api from '@/api';

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, currentArtwork, bids, loading, newBidId, setCurrentArtwork, setBids, addBid, updateArtwork, deductWallet, login } = useStore();
  const [bidAmount, setBidAmount] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!id) return;
    const artworkId = parseInt(id, 10);

    const fetchData = async () => {
      try {
        const [artwork, bidList] = await Promise.all([
          api.getArtworkById(artworkId),
          api.getBids(artworkId),
        ]);
        setCurrentArtwork(artwork);
        setBids(bidList);
      } catch (err) {
        console.error('Failed to fetch artwork:', err);
      }
    };

    fetchData();

    pollRef.current = window.setInterval(async () => {
      try {
        const result = await api.pollArtwork(artworkId);
        updateArtwork(result.artwork);
        setBids(result.bids);
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 3000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
      setCurrentArtwork(null);
      setBids([]);
    };
  }, [id, setCurrentArtwork, setBids, updateArtwork]);

  useEffect(() => {
    if (currentArtwork) {
      setBidAmount(String(currentArtwork.currentPrice + currentArtwork.minIncrement));
    }
  }, [currentArtwork]);

  const handleBid = async () => {
    if (!user) {
      try {
        await login('artlover');
      } catch (err) {
        setError('登录失败，请重试');
        return;
      }
    }

    const currentUser = useStore.getState().user;
    if (!currentUser || !currentArtwork) return;

    const amount = parseInt(bidAmount, 10);
    if (isNaN(amount) || amount <= currentArtwork.currentPrice) {
      setError('出价必须高于当前价格');
      return;
    }

    if (amount > currentUser.wallet) {
      setError('余额不足');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const bid = await api.submitBid({
        artworkId: currentArtwork.id,
        userId: currentUser.id,
        amount,
      });
      addBid(bid);
      deductWallet(amount);
      setBidAmount(String(amount + currentArtwork.minIncrement));
    } catch (err: any) {
      setError(err.response?.data?.message || '出价失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentArtwork && loading) {
    return <div className="detail-loading">加载中...</div>;
  }

  if (!currentArtwork) {
    return <div className="detail-error">未找到该拍卖品</div>;
  }

  const minBid = currentArtwork.currentPrice + currentArtwork.minIncrement;

  return (
    <div className="detail-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← 返回
      </button>

      <div className="detail-content">
        <div className="detail-image-section">
          <img
            src={currentArtwork.imageUrl}
            alt={currentArtwork.title}
            className="detail-image"
          />
        </div>

        <div className="detail-info-section">
          <h1 className="detail-title">{currentArtwork.title}</h1>
          <p className="detail-creator">艺术家：{currentArtwork.creator}</p>
          <p className="detail-description">{currentArtwork.description}</p>

          <div className="detail-price-box">
            <div className="price-info">
              <span className="price-label">当前价格</span>
              <span className="price-value">¥{currentArtwork.currentPrice.toLocaleString()}</span>
            </div>
            <div className="bid-info">
              <span className="bid-count">{bids.length} 次出价</span>
              <span className="min-increment">最小加价 ¥{currentArtwork.minIncrement}</span>
            </div>
          </div>

          <div className="bid-section">
            <div className="bid-input-wrapper">
              <span className="bid-prefix">¥</span>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                min={minBid}
                step={currentArtwork.minIncrement}
                className="bid-input"
                placeholder={`最低 ${minBid}`}
              />
            </div>
            <button
              className="bid-button"
              onClick={handleBid}
              disabled={submitting || !user}
            >
              {submitting ? '出价中...' : user ? '立即出价' : '登录并出价'}
            </button>
            {error && <p className="bid-error">{error}</p>}
          </div>

          {user && (
            <div className="wallet-info">
              <span>钱包余额：</span>
              <span className="wallet-amount">¥{user.wallet.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bids-section">
        <h2 className="bids-title">出价记录</h2>
        {bids.length === 0 ? (
          <p className="no-bids">暂无出价，成为第一个出价者！</p>
        ) : (
          <div className="bids-list">
            {bids.map((bid) => (
              <div
                key={bid.id}
                className={`bid-item ${newBidId === bid.id ? 'bid-flash' : ''}`}
              >
                <img src={bid.avatar} alt={bid.username} className="bid-avatar" />
                <div className="bid-info">
                  <span className="bid-username">{bid.username}</span>
                  <span className="bid-time">
                    {new Date(bid.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
                <span className="bid-amount">¥{bid.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
