import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { AuctionContext } from '../App';
import type { BidRecord } from '../types';

const BidPanel: React.FC = () => {
  const context = useContext(AuctionContext);
  if (!context) throw new Error('AuctionContext 未找到');

  const {
    items,
    selectedItemId,
    setItems,
    bids,
    setBids,
    soldItems,
    setSoldItems,
    auctionActive
  } = context;

  const [bidAmount, setBidAmount] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSold, setIsSold] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countdownRef = useRef<number | null>(null);

  const selectedItem = items.find(i => i.id === selectedItemId) || null;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  const triggerParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      life: number;
      gravity: number;
    }> = [];

    const colors = ['#F59E0B', '#FBBF24', '#FFFFFF', '#FDE68A'];
    const particleCount = 80;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
      const speed = 4 + Math.random() * 8;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        gravity: 0.15
      });
    }

    const startTime = performance.now();
    const duration = 2000;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed >= duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.life = 1 - elapsed / duration;

        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(elapsed * 0.01 + p.vx);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, []);

  const handleSold = useCallback(() => {
    if (!selectedItem) return;
    setIsSold(true);
    triggerParticles();

    const updatedItem = { ...selectedItem, sold: true };
    setItems(prev => prev.map(i => (i.id === selectedItem.id ? updatedItem : i)));
    setSoldItems(prev => [...prev, updatedItem]);

    axios.put(`/api/items/${selectedItem.id}`, { sold: true, currentPrice: selectedItem.currentPrice });

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, [selectedItem, setItems, setSoldItems, triggerParticles]);

  useEffect(() => {
    if (selectedItemId && auctionActive && !selectedItem?.sold) {
      setCountdown(10);
      setIsSold(false);

      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }

      countdownRef.current = window.setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
              countdownRef.current = null;
            }
            handleSold();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [selectedItemId, auctionActive, selectedItem?.sold, handleSold]);

  const handleBid = async () => {
    if (!selectedItem || !bidAmount) return;

    const amount = Number(bidAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (amount % 10 !== 0) return;
    if (amount <= selectedItem.currentPrice) return;

    try {
      const res = await axios.post('/api/bids', {
        itemId: selectedItem.id,
        amount
      });

      const newBid: BidRecord = res.data;
      setBids(prev => [newBid, ...prev].slice(0, 20));

      setItems(prev =>
        prev.map(i => (i.id === selectedItem.id ? { ...i, currentPrice: amount } : i))
      );

      await axios.put(`/api/items/${selectedItem.id}`, { currentPrice: amount });

      setBidAmount('');
      setCountdown(10);
    } catch (error) {
      console.error('出价失败:', error);
    }
  };

  const recentBids = bids.slice(0, 5);

  if (!selectedItem) {
    return (
      <div className="bid-section">
        <div className="bid-panel-placeholder">点击转盘上的"开始拍卖"按钮开始</div>
      </div>
    );
  }

  return (
    <div className="bid-section">
      <canvas ref={canvasRef} className="particles-canvas" />
      <div className="bid-panel">
        <div className="item-detail">
          <img src={selectedItem.image} alt={selectedItem.name} className="item-image" />
          <div className="item-info">
            <h2 className="item-name">{selectedItem.name}</h2>
            <p className="item-description">{selectedItem.description}</p>
          </div>

          <div className="current-bid">
            <span className="current-bid-label">当前出价</span>
            <span className="current-bid-price">¥{selectedItem.currentPrice}</span>
          </div>

          {!isSold && countdown !== null && (
            <div className={`countdown ${countdown <= 3 ? 'warning' : ''}`}>
              ⏱️ 剩余时间：{countdown}秒
            </div>
          )}

          {isSold && (
            <div className="countdown" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#10B981' }}>
              🎉 恭喜！物品已成交！
            </div>
          )}

          {!isSold && auctionActive && (
            <div className="bid-input-group">
              <input
                type="number"
                className="bid-input"
                placeholder={`加价金额（步长10元，最低¥${selectedItem.currentPrice + 10}）`}
                value={bidAmount}
                onChange={e => setBidAmount(e.target.value)}
                step={10}
                min={selectedItem.currentPrice + 10}
                onKeyDown={e => e.key === 'Enter' && handleBid()}
              />
              <button
                className="bid-submit-btn"
                onClick={handleBid}
                disabled={!bidAmount || Number(bidAmount) % 10 !== 0 || Number(bidAmount) <= selectedItem.currentPrice}
              >
                出价
              </button>
            </div>
          )}

          <div className="bid-history">
            <div className="bid-history-title">出价记录</div>
            {recentBids.length === 0 ? (
              <p style={{ color: '#6B7280', fontSize: '13px', padding: '12px 0' }}>暂无出价记录</p>
            ) : (
              recentBids.map(bid => (
                <div key={bid.id} className="bid-record">
                  <div className="bid-avatar">{bid.userAvatar}</div>
                  <div className="bid-user-info">
                    <div className="bid-user-name">{bid.userName}</div>
                    <div className="bid-time">{formatTime(bid.createdAt)}</div>
                  </div>
                  <div className="bid-amount">¥{bid.amount}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BidPanel;
