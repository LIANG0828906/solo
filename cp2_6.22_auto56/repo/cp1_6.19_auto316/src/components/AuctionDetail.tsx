import React, { useState } from 'react';
import { useAuctionStore } from '../store/auctionStore';
import NegotiationPanel from './NegotiationPanel';

function Countdown({ endTime }: { endTime: number }) {
  const [remaining, setRemaining] = useState(Math.max(0, endTime - Date.now()));

  React.useEffect(() => {
    const tick = () => setRemaining(Math.max(0, endTime - Date.now()));
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (remaining <= 0) return <span style={{ color: '#999' }}>已结束</span>;

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const isUrgent = remaining < 60000;
  const timeStr = mins > 60
    ? `${Math.floor(mins / 60)}h ${mins % 60}m ${secs}s`
    : `${mins}m ${secs}s`;

  return (
    <span
      style={{
        fontSize: 14,
        color: isUrgent ? '#C62828' : '#666',
        animation: isUrgent ? 'blink 1s infinite' : 'none',
        fontWeight: isUrgent ? 700 : 400,
      }}
    >
      ⏱ {timeStr}
    </span>
  );
}

export default function AuctionDetail() {
  const auction = useAuctionStore((s) => s.selectedAuction);
  const bids = useAuctionStore((s) => s.bids);
  const nickname = useAuctionStore((s) => s.nickname);
  const placeBid = useAuctionStore((s) => s.placeBid);
  const setPage = useAuctionStore((s) => s.setPage);
  const [bidAmount, setBidAmount] = useState('');
  const [showNeg, setShowNeg] = useState(false);

  if (!auction) return null;

  const isSold = auction.status === 'sold';
  const minBid = auction.currentHighestBid + 1;

  const handleBid = () => {
    const amount = Number(bidAmount);
    if (!amount || amount <= auction.currentHighestBid) return;
    placeBid(auction.id, amount);
    setBidAmount('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBid();
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
      <div
        style={{
          flex: 1,
          padding: '24px 32px',
          maxWidth: showNeg ? 'calc(100% - 320px)' : '100%',
          transition: 'max-width 0.3s',
        }}
      >
        <button
          onClick={() => setPage('list')}
          style={{
            background: 'none',
            border: 'none',
            color: '#A0522D',
            fontSize: 14,
            cursor: 'pointer',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ← 返回列表
        </button>

        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          <div
            style={{
              width: 220,
              height: 300,
              borderRadius: 12,
              background: auction.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 80, fontWeight: 700, color: '#fff', opacity: 0.9 }}>
              {auction.title[0]}
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 24, color: '#333', marginBottom: 8 }}>
              《{auction.title}》
            </h1>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
              {auction.description}
            </p>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#888' }}>卖家：</span>
              <span style={{ fontSize: 13, color: '#A0522D', fontWeight: 600 }}>
                {auction.sellerName}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: '#888' }}>当前最高价</div>
                <div style={{ fontSize: 22, color: '#A0522D', fontWeight: 700 }}>
                  ¥{auction.currentHighestBid}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#888' }}>一口价</div>
                <div style={{ fontSize: 22, color: '#2E7D32', fontWeight: 700 }}>
                  ¥{auction.buyNowPrice}
                </div>
              </div>
            </div>
            <Countdown endTime={auction.endTime} />
            {isSold && (
              <div
                style={{
                  marginTop: 12,
                  background: '#2E7D32',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: 8,
                  display: 'inline-block',
                  fontWeight: 600,
                }}
              >
                已成交 - ¥{auction.soldPrice}
              </div>
            )}
          </div>
        </div>

        {!isSold && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 24,
              alignItems: 'center',
            }}
          >
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`最低 ¥${minBid}`}
              min={minBid}
              style={{
                flex: 1,
                maxWidth: 200,
                padding: '10px 14px',
                border: '2px solid #E0D8CC',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#A0522D')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E0D8CC')}
            />
            <button
              onClick={handleBid}
              style={{
                padding: '10px 24px',
                background: '#A0522D',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#8B4513')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#A0522D')}
            >
              出价
            </button>
            <button
              onClick={() => setShowNeg(!showNeg)}
              style={{
                padding: '10px 18px',
                background: '#D4A017',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#B8860B')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#D4A017')}
            >
              💬 议价
            </button>
          </div>
        )}

        <div>
          <h3 style={{ fontSize: 16, color: '#333', marginBottom: 12 }}>
            出价记录 ({bids.length})
          </h3>
          {bids.length === 0 ? (
            <p style={{ color: '#999', fontSize: 14 }}>暂无出价</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...bids].reverse().map((bid, i) => (
                <div
                  key={bid.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 14px',
                    background: '#fff',
                    borderRadius: 8,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    animation: 'slideInRight 0.3s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: `hsl(${bid.bidder.charCodeAt(0) * 7 % 360}, 60%, 80%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#555',
                      }}
                    >
                      {bid.bidder[0]}
                    </div>
                    <span style={{ fontSize: 13, color: '#555' }}>{bid.bidder}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#A0522D' }}>
                      ¥{bid.amount}
                    </span>
                    <span style={{ fontSize: 11, color: '#aaa' }}>
                      {new Date(bid.time).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showNeg && (
        <NegotiationPanel
          auctionId={auction.id}
          sellerName={auction.sellerName}
          onClose={() => setShowNeg(false)}
        />
      )}
    </div>
  );
}
