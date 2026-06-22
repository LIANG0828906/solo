import { useState, useEffect, useCallback, useRef } from 'react';
import type { RoomState, User, WSMessage, BidRecord } from './types';
import { createMockWebSocket } from './utils/mockWebSocket';
import AuctionRoom from './AuctionRoom';

const AVATAR_COLORS = ['#D4AF37', '#CD853F', '#DAA520', '#B8860B', '#FFD700', '#F0E68C'];

function generateUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getAvatarColor(nickname: string): string {
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function App() {
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const wsRef = useRef<ReturnType<typeof createMockWebSocket> | null>(null);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = useCallback((message: string) => {
    setNotification(message);
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
    notificationTimerRef.current = setTimeout(() => {
      setNotification(null);
    }, 3000);
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    const message = JSON.parse(event.data) as WSMessage;

    switch (message.type) {
      case 'ROOM_STATE':
        setRoomState(message.payload as RoomState);
        break;
      case 'NEW_BID': {
        const payload = message.payload as { bid: BidRecord; countdown: number; highestBid: number; highestBidder: string; highestBidderNickname: string };
        setRoomState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            bidHistory: [...prev.bidHistory, payload.bid],
            countdown: payload.countdown,
            highestBid: payload.highestBid,
            highestBidder: payload.highestBidder,
            highestBidderNickname: payload.highestBidderNickname,
          };
        });
        showNotification(`${payload.bid.nickname} 出价 ¥${payload.bid.amount}`);
        break;
      }
      case 'ITEM_CHANGED':
        setRoomState((prev) => {
          if (!prev) return prev;
          const payload = message.payload as { item: RoomState['currentItem']; countdown: number; bidHistory: BidRecord[] };
          return {
            ...prev,
            currentItem: payload.item,
            countdown: payload.countdown,
            bidHistory: payload.bidHistory,
            highestBid: payload.item?.startPrice || 0,
            highestBidder: '',
            highestBidderNickname: '',
            status: 'bidding',
          };
        });
        break;
      case 'AUCTION_ENDED':
        setRoomState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: 'ended',
          };
        });
        break;
    }
  }, [showNotification]);

  const handleJoin = useCallback(() => {
    if (!nickname.trim() || !roomId.trim()) return;

    const userId = generateUserId();
    const user: User = {
      id: userId,
      nickname: nickname.trim(),
      avatar: getAvatarColor(nickname.trim()),
    };

    const ws = createMockWebSocket(`ws://localhost:8080/${roomId.trim()}`);
    wsRef.current = ws;

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        payload: {
          roomId: roomId.trim(),
          user,
        },
      }));
      setCurrentUser(user);
      setJoined(true);
    });

    ws.addEventListener('message', handleMessage);
  }, [nickname, roomId, handleMessage]);

  const handleBid = useCallback((amount: number) => {
    if (!wsRef.current || !currentUser) return;
    wsRef.current.send(JSON.stringify({
      type: 'PLACE_BID',
      payload: {
        roomId: roomId,
        userId: currentUser.id,
        amount,
      },
    }));
  }, [roomId, currentUser]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  if (!joined) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(ellipse at center, #4A0E0E 0%, #1A0A0A 100%)',
          padding: '20px',
        }}
      >
        <div
          className="glass-card animate-fade-in-up"
          style={{
            padding: '48px 40px',
            width: '100%',
            maxWidth: '420px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1
              className="gold-text"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '36px',
                marginBottom: '8px',
                letterSpacing: '2px',
              }}
            >
              迷你拍卖会场
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              实时竞价，一锤定音
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  color: 'var(--color-gold)',
                  fontSize: '14px',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-display)',
                }}
              >
                您的昵称
              </label>
              <input
                type="text"
                className="input-field"
                style={{ width: '100%' }}
                placeholder="请输入您的昵称"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  color: 'var(--color-gold)',
                  fontSize: '14px',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-display)',
                }}
              >
                房间号
              </label>
              <input
                type="text"
                className="input-field"
                style={{ width: '100%' }}
                placeholder="输入房间号加入或创建"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>

            <button
              className="btn-gold"
              style={{ width: '100%', marginTop: '8px', padding: '14px' }}
              onClick={handleJoin}
              disabled={!nickname.trim() || !roomId.trim()}
            >
              加入 / 创建房间
            </button>
          </div>

          <div
            style={{
              marginTop: '32px',
              paddingTop: '20px',
              borderTop: '1px solid var(--color-border-gold)',
              textAlign: 'center',
            }}
          >
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
              提示：同一房间号的用户将进入同一个拍卖会场
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuctionRoom
      roomState={roomState}
      currentUser={currentUser!}
      onBid={handleBid}
      notification={notification}
    />
  );
}
