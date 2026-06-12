import { useState, useEffect, useRef, useCallback } from 'react';
import type { RoomState, User, BidRecord, AuctionItem } from './types';
import ItemDisplay from './components/ItemDisplay';
import BidHistory from './components/BidHistory';
import { playGavelSound, playWinSound } from './utils/audio';
import { ParticleSystem } from './utils/particles';
import { BID_INCREMENT } from './utils/mockWebSocket';

interface AuctionRoomProps {
  roomState: RoomState | null;
  currentUser: User;
  onBid: (amount: number) => void;
  notification: string | null;
}

export default function AuctionRoom({ roomState, currentUser, onBid, notification }: AuctionRoomProps) {
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [showWinModal, setShowWinModal] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState<{ nickname: string; amount: number; itemName: string } | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const prevBidCountRef = useRef<number>(0);

  useEffect(() => {
    if (particleCanvasRef.current && !particleSystemRef.current) {
      particleSystemRef.current = new ParticleSystem(particleCanvasRef.current);
    }
    return () => {
      if (particleSystemRef.current) {
        particleSystemRef.current.destroy();
        particleSystemRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!roomState?.currentItem) return;
    const minBid = roomState.highestBid + BID_INCREMENT;
    setBidAmount(minBid);
  }, [roomState?.currentItem?.id, roomState?.highestBid]);

  useEffect(() => {
    if (!roomState) return;

    if (prevBidCountRef.current < roomState.bidHistory.length && roomState.bidHistory.length > 0) {
      const lastBid = roomState.bidHistory[roomState.bidHistory.length - 1];
      if (lastBid.userId !== currentUser.id) {
        playGavelSound();
      }
    }
    prevBidCountRef.current = roomState.bidHistory.length;
  }, [roomState?.bidHistory, currentUser.id]);

  useEffect(() => {
    if (!roomState || !roomState.currentItem) return;

    if (prevStatusRef.current === 'bidding' && roomState.status === 'ended') {
      playWinSound();

      if (particleSystemRef.current) {
        particleSystemRef.current.explode(window.innerWidth / 2, window.innerHeight / 2, 150);
      }

      setWinnerInfo({
        nickname: roomState.highestBidderNickname || '无人',
        amount: roomState.highestBid,
        itemName: roomState.currentItem.name,
      });
      setShowWinModal(true);

      setTimeout(() => {
        setShowWinModal(false);
      }, 2500);
    }

    prevStatusRef.current = roomState.status;
  }, [roomState?.status, roomState?.currentItem, roomState?.highestBid, roomState?.highestBidderNickname]);

  const handleBid = useCallback(() => {
    if (!roomState || roomState.status !== 'bidding') return;
    if (bidAmount <= roomState.highestBid) return;

    playGavelSound();
    onBid(bidAmount);
  }, [bidAmount, onBid, roomState]);

  const handleQuickBid = useCallback((increment: number) => {
    if (!roomState || roomState.status !== 'bidding') return;
    const newAmount = roomState.highestBid + increment;
    playGavelSound();
    onBid(newAmount);
  }, [onBid, roomState]);

  const handleUploadItem = useCallback((item: AuctionItem) => {
    // 上传商品逻辑会在 ItemDisplay 组件中通过 WebSocket 发送
    console.log('Upload item:', item);
  }, []);

  if (!roomState || !roomState.currentItem) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #4A0E0E 0%, #1A0A0A 100%)',
      }}>
        <div className="gold-text" style={{ fontSize: '24px', fontFamily: 'var(--font-display)' }}>
          正在加载拍卖会场...
        </div>
      </div>
    );
  }

  const countdownPercent = (roomState.countdown / 45) * 100;
  const isUrgent = roomState.countdown <= 10;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #4A0E0E 0%, #1A0A0A 60%, #0D0505 100%)',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={particleCanvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 100,
        }}
      />

      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            background: 'linear-gradient(90deg, rgba(74, 14, 14, 0.95), rgba(212, 175, 55, 0.95), rgba(74, 14, 14, 0.95))',
            padding: '12px 40px',
            borderRadius: '8px',
            border: '1px solid var(--color-gold)',
            animation: 'flash 0.5s ease-in-out',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          <span
            className="gold-text"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '16px',
              fontWeight: 600,
              display: 'inline-block',
              animation: 'bannerScroll 8s linear infinite',
            }}
          >
            🔨 {notification} &nbsp;&nbsp;&nbsp;&nbsp; 🔨 {notification}
          </span>
        </div>
      )}

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1
              className="gold-text"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '28px',
                letterSpacing: '2px',
              }}
            >
              🏛️ 拍卖会场
            </h1>
            <div
              className="glass-card"
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
              }}
            >
              房间号: <span className="gold-text">{roomState.roomId}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              className="glass-card"
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#4CAF50',
                  boxShadow: '0 0 8px #4CAF50',
                }}
              />
              <span style={{ color: 'var(--color-text-secondary)' }}>
                在线: <span className="gold-text">{roomState.users.length}</span> 人
              </span>
            </div>
            <div
              className="glass-card"
              style={{
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: currentUser.avatar,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#1A0A0A',
                }}
              >
                {currentUser.nickname.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '14px' }}>{currentUser.nickname}</span>
            </div>
          </div>
        </div>

        <div
          className="glass-card animate-fade-in-up"
          style={{
            padding: '20px',
            marginBottom: '16px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '4px',
              width: `${countdownPercent}%`,
              background: isUrgent
                ? 'linear-gradient(90deg, #ff4444, #ffaa00)'
                : 'linear-gradient(90deg, var(--color-gold-dark), var(--color-gold-light))',
              transition: 'width 1s linear, background 0.3s ease',
              boxShadow: isUrgent
                ? '0 0 20px rgba(255, 68, 68, 0.8)'
                : '0 0 20px rgba(212, 175, 55, 0.6)',
            }}
          />
          <div
            className={`gold-text ${isUrgent ? 'animate-pulse-gold' : ''}`}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '56px',
              fontWeight: 'bold',
              letterSpacing: '4px',
              fontVariantNumeric: 'tabular-nums',
              color: isUrgent ? '#ff6644' : 'var(--color-gold)',
              textShadow: isUrgent
                ? '0 0 30px rgba(255, 68, 68, 0.8)'
                : '0 0 30px rgba(212, 175, 55, 0.6)',
            }}
          >
            {String(Math.floor(roomState.countdown / 60)).padStart(2, '0')}:
            {String(roomState.countdown % 60).padStart(2, '0')}
          </div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {roomState.status === 'bidding' ? '距落槌还剩' : '拍卖结束'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
            <ItemDisplay
              item={roomState.currentItem}
              highestBid={roomState.highestBid}
              highestBidder={roomState.highestBidderNickname}
              status={roomState.status}
              onUpload={handleUploadItem}
              roomId={roomState.roomId}
            />

            <div
              className="glass-card"
              style={{
                padding: '20px',
                marginTop: '16px',
              }}
            >
              <h3
                className="gold-text"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '18px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                🔨 出价
              </h3>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      color: 'var(--color-text-secondary)',
                      fontSize: '12px',
                      marginBottom: '6px',
                    }}
                  >
                    出价金额 (元)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    style={{ width: '100%', fontSize: '18px', fontWeight: 'bold' }}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    min={roomState.highestBid + BID_INCREMENT}
                    step={BID_INCREMENT}
                    disabled={roomState.status !== 'bidding'}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      color: 'var(--color-text-secondary)',
                      fontSize: '12px',
                      marginBottom: '6px',
                    }}
                  >
                    当前最高
                  </label>
                  <div
                    className="gold-text"
                    style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      fontFamily: 'var(--font-display)',
                      padding: '12px',
                      background: 'rgba(212, 175, 55, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border-gold)',
                    }}
                  >
                    ¥{roomState.highestBid.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {[10, 50, 100, 500].map((inc) => (
                  <button
                    key={inc}
                    className="glass-card"
                    style={{
                      padding: '8px 16px',
                      border: '1px solid var(--color-border-gold)',
                      background: 'rgba(74, 14, 14, 0.4)',
                      color: 'var(--color-gold)',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      fontSize: '13px',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => handleQuickBid(inc)}
                    disabled={roomState.status !== 'bidding'}
                    onMouseEnter={(e) => {
                      if (roomState.status === 'bidding') {
                        e.currentTarget.style.background = 'rgba(212, 175, 55, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(74, 14, 14, 0.4)';
                    }}
                  >
                    +¥{inc}
                  </button>
                ))}
              </div>

              <button
                className="btn-gold"
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '18px',
                  letterSpacing: '4px',
                }}
                onClick={handleBid}
                disabled={roomState.status !== 'bidding' || bidAmount <= roomState.highestBid}
              >
                🔨 举牌出价
              </button>

              {roomState.highestBidderNickname && roomState.status === 'bidding' && (
                <div
                  style={{
                    marginTop: '12px',
                    textAlign: 'center',
                    fontSize: '13px',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  目前领先: <span className="gold-text">{roomState.highestBidderNickname}</span>
                </div>
              )}
            </div>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <BidHistory
              bids={roomState.bidHistory}
              highestBid={roomState.highestBid}
              startPrice={roomState.currentItem.startPrice}
            />
          </div>
        </div>
      </div>

      {showWinModal && winnerInfo && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            background: 'rgba(26, 10, 10, 0.8)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeInUp 0.3s ease-out',
          }}
        >
          <div
            className="glass-card"
            style={{
              padding: '48px 64px',
              textAlign: 'center',
              border: '2px solid var(--color-gold)',
              boxShadow: '0 0 60px rgba(212, 175, 55, 0.4)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏆</div>
            <h2
              className="gold-text"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '32px',
                marginBottom: '12px',
                letterSpacing: '2px',
              }}
            >
              成交！
            </h2>
            <p style={{ color: 'var(--color-text-primary)', fontSize: '18px', marginBottom: '8px' }}>
              恭喜 <span className="gold-text" style={{ fontWeight: 'bold' }}>{winnerInfo.nickname}</span>
            </p>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '16px', marginBottom: '16px' }}>
              拍得「{winnerInfo.itemName}」
            </p>
            <div
              className="gold-text"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '42px',
                fontWeight: 'bold',
              }}
            >
              ¥{winnerInfo.amount.toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
