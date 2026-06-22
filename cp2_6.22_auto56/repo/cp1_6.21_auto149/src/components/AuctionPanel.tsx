import React, { useState, useEffect, useRef } from 'react';
import { useAuction } from '../context/AuctionContext';

function formatTime(ts: number): string {
  const d = new Date(ts);
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${mm}:${ss}`;
}

function formatPrice(n: number): string {
  return '¥' + n.toLocaleString('zh-CN');
}

export default function AuctionPanel() {
  const {
    products,
    selectedProductId,
    bids,
    currentProduct,
    selectProduct,
    placeBid,
    highestBid,
  } = useAuction();

  const [bidInput, setBidInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const bidListRef = useRef<HTMLDivElement>(null);

  const minBid = highestBid ? Math.floor(highestBid * 1.05) : 0;
  const canBid = bidInput !== '' && Number(bidInput) >= minBid;

  useEffect(() => {
    setBidInput('');
  }, [selectedProductId]);

  useEffect(() => {
    setFadeKey((k) => k + 1);
  }, [selectedProductId]);

  useEffect(() => {
    if (bidListRef.current) {
      bidListRef.current.scrollTop = bidListRef.current.scrollHeight;
    }
  }, [bids]);

  const handleBid = async () => {
    if (!canBid || submitting) return;
    setSubmitting(true);
    try {
      await placeBid(Number(bidInput));
      setBidInput('');
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBid();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) {
      setBidInput(val);
    }
  };

  if (!currentProduct) return null;

  const latestBidId = bids.length > 0 ? bids[bids.length - 1].id : null;

  return (
    <div
      key={fadeKey}
      style={{
        width: '400px',
        minWidth: '400px',
        background: '#1E293B',
        borderRadius: '8px',
        border: '0.5px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div style={{ padding: '16px' }}>
        <select
          value={selectedProductId}
          onChange={(e) => selectProduct(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: '#0F172A',
            color: '#F8FAFC',
            border: '1px solid #334155',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.id} - {p.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            width: '240px',
            height: '240px',
            borderRadius: '8px',
            background: '#E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748B',
            fontSize: '16px',
            marginBottom: '12px',
          }}
        >
          拍卖品图片
        </div>
        <div
          style={{
            fontWeight: 'bold',
            color: '#F8FAFC',
            fontSize: '20px',
            textAlign: 'center',
            marginBottom: '4px',
          }}
        >
          {currentProduct.name}
        </div>
        <div style={{ color: '#94A3B8', fontSize: '16px' }}>
          起拍价 {formatPrice(currentProduct.startingPrice)}
        </div>
      </div>

      <div
        style={{
          padding: '8px 16px',
          fontSize: '13px',
          color: '#94A3B8',
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>出价记录</span>
        <span>共 {bids.length} 条</span>
      </div>

      <div
        ref={bidListRef}
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          flex: 1,
          padding: '0',
        }}
      >
        {bids.map((bid, idx) => (
          <div
            key={bid.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              background: bid.id === latestBidId ? '#1E3A5F' : 'transparent',
              borderBottom:
                idx < bids.length - 1 ? '1px solid #334155' : 'none',
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: bid.bidderColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F8FAFC',
                fontSize: '14px',
                fontWeight: 'bold',
                flexShrink: 0,
              }}
            >
              {bid.bidder.charAt(bid.bidder.length - 1)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: '#F8FAFC',
                  fontSize: '14px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {bid.bidder}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ color: '#F8FAFC', fontSize: '14px', fontWeight: 'bold' }}>
                {formatPrice(bid.amount)}
              </div>
              <div style={{ color: '#94A3B8', fontSize: '12px' }}>
                {formatTime(bid.timestamp)}
              </div>
            </div>
          </div>
        ))}
        {bids.length === 0 && (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: '#64748B',
              fontSize: '14px',
            }}
          >
            暂无出价记录
          </div>
        )}
      </div>

      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #334155',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          inputMode="numeric"
          placeholder={`最低 ¥${minBid.toLocaleString('zh-CN')}`}
          value={bidInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            padding: '10px 12px',
            background: '#0F172A',
            color: '#F8FAFC',
            border: '1px solid #334155',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <button
          onClick={handleBid}
          disabled={!canBid || submitting}
          style={{
            padding: '10px 20px',
            background: canBid ? '#3B82F6' : '#334155',
            color: canBid ? '#F8FAFC' : '#64748B',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: canBid ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            boxShadow: canBid ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (canBid) {
              e.currentTarget.style.background = '#2563EB';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (canBid) {
              e.currentTarget.style.background = '#3B82F6';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.3)';
            }
          }}
        >
          出价
        </button>
      </div>
    </div>
  );
}
