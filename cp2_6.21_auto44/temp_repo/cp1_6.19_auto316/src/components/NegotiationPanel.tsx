import React, { useState, useRef, useEffect } from 'react';
import { useAuctionStore, Negotiation } from '../store/auctionStore';

export default function NegotiationPanel({
  auctionId,
  sellerName,
  onClose,
}: {
  auctionId: string;
  sellerName: string;
  onClose: () => void;
}) {
  const negotiations = useAuctionStore((s) => s.negotiations);
  const nickname = useAuctionStore((s) => s.nickname);
  const sendNegotiation = useAuctionStore((s) => s.sendNegotiation);
  const acceptNegotiation = useAuctionStore((s) => s.acceptNegotiation);
  const rejectNegotiation = useAuctionStore((s) => s.rejectNegotiation);
  const selectedAuction = useAuctionStore((s) => s.selectedAuction);

  const [negAmount, setNegAmount] = useState('');
  const [negMessage, setNegMessage] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const isSeller = selectedAuction?.sellerName === nickname;

  const relevantNegs = negotiations.filter((n) => n.auctionId === auctionId);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [relevantNegs.length]);

  const handleSend = () => {
    const amount = Number(negAmount);
    if (!amount || !negMessage.trim()) return;
    sendNegotiation(auctionId, amount, negMessage.trim());
    setNegAmount('');
    setNegMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getRandomLightColor = (name: string) => {
    const hue = name.charCodeAt(0) * 7 % 360;
    return `hsl(${hue}, 60%, 85%)`;
  };

  return (
    <div
      style={{
        width: 320,
        borderLeft: '1px solid #E0D8CC',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        animation: 'fadeIn 0.2s ease',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #E0D8CC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
          💬 议价面板
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 18,
            cursor: 'pointer',
            color: '#999',
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {relevantNegs.length === 0 && (
          <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', marginTop: 20 }}>
            暂无议价消息
          </p>
        )}
        {relevantNegs.map((neg) => {
          const isMine = neg.from === nickname;
          return (
            <div
              key={neg.id}
              style={{
                animation: 'expandUp 0.3s ease',
                alignSelf: isMine ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: getRandomLightColor(neg.from),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#555',
                  }}
                >
                  {neg.from[0]}
                </div>
                <span style={{ fontSize: 11, color: '#888' }}>{neg.from}</span>
                <span style={{ fontSize: 11, color: '#aaa' }}>
                  {new Date(neg.time).toLocaleTimeString()}
                </span>
              </div>
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: isMine ? '#A0522D' : '#E0D8CC',
                  color: isMine ? '#fff' : '#333',
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 2 }}>
                  议价 ¥{neg.amount}
                </div>
                <div>{neg.message}</div>
              </div>

              {isSeller && neg.status === 'pending' && (
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    marginTop: 6,
                  }}
                >
                  <button
                    onClick={() => acceptNegotiation(auctionId, neg.id)}
                    style={{
                      flex: 1,
                      padding: '5px 0',
                      background: '#2E7D32',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    接受
                  </button>
                  <button
                    onClick={() => rejectNegotiation(auctionId, neg.id)}
                    style={{
                      flex: 1,
                      padding: '5px 0',
                      background: '#C62828',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    拒绝
                  </button>
                </div>
              )}

              {neg.status === 'accepted' && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    color: '#2E7D32',
                    fontWeight: 600,
                  }}
                >
                  ✓ 已接受
                </div>
              )}
              {neg.status === 'rejected' && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    color: '#C62828',
                    fontWeight: 600,
                  }}
                >
                  ✕ 已拒绝
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isSeller && selectedAuction?.status === 'active' && (
        <div
          style={{
            padding: 12,
            borderTop: '1px solid #E0D8CC',
          }}
        >
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input
              type="number"
              value={negAmount}
              onChange={(e) => setNegAmount(e.target.value)}
              placeholder="议价金额"
              style={{
                flex: 1,
                padding: '8px 10px',
                border: '1px solid #E0D8CC',
                borderRadius: 6,
                fontSize: 13,
                outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#D4A017')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E0D8CC')}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={negMessage}
              onChange={(e) => setNegMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="留言..."
              maxLength={100}
              style={{
                flex: 1,
                padding: '8px 10px',
                border: '1px solid #E0D8CC',
                borderRadius: 6,
                fontSize: 13,
                outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#D4A017')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E0D8CC')}
            />
            <button
              onClick={handleSend}
              style={{
                padding: '8px 14px',
                background: '#D4A017',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#B8860B')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#D4A017')}
            >
              发送
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
