import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomManager, RoomState, PublicPlayer } from '../roomManager';

const Room: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [teamsModal, setTeamsModal] = useState<{
    id: number;
    name: string;
    players: PublicPlayer[];
  }[] | null>(null);
  const [error, setError] = useState('');
  const myId = roomManager.getPlayerId();

  useEffect(() => {
    if (!code) return;

    const unsub = roomManager.onMessage((type, data) => {
      if (type === 'room_joined' || type === 'player_joined' || type === 'player_left') {
        setRoom(data.room);
      }
      if (type === 'teams_assigned') {
        setRoom(data.room);
        setTeamsModal(data.teams);
        setTimeout(() => {
          navigate(`/game/${code}`);
        }, 4000);
      }
      if (type === 'error') {
        setError(data.message);
      }
    });

    if (roomManager.getRoomCode() !== code) {
      navigate('/');
    }

    return unsub;
  }, [code, navigate]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code || '');
  };

  const handleStart = () => {
    if (!room) {
      roomManager.startGame();
    }
  };

  const handleLeave = () => {
    roomManager.leaveRoom();
    navigate('/');
  };

  const isHost = room?.hostId === myId;

  if (!room) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#a0aec0' }}>加载中...</div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card fade-in" style={{ maxWidth: 700, width: '100%' }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 800 }}>🏠 等待房间</h2>
            <p style={{ color: '#a0aec0', fontSize: 14, marginTop: 4 }}>
              等待玩家加入，准备开始游戏</p>
          </div>
          <button onClick={handleLeave} style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(233, 69, 96, 0.2)', color: '#ff8098', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            离开房间
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: 18,
            marginBottom: 24,
            borderRadius: 14,
            background: 'rgba(15, 52, 96, 0.5)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <span style={{ color: '#a0aec0' }}>房间码：</span>
          <span style={{
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: 8,
            color: '#e94560',
            fontFamily: 'monospace'
          }}>
            {code}
          </span>
          <button onClick={handleCopy}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              background: 'rgba(233, 69, 96, 0.2)',
              color: '#ff8098',
              border: '1px solid rgba(233, 69, 96, 0.3)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 12
            }}
          >
            📋 复制
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontWeight: 700 }}>👥 玩家列表 ({room.players.length}/4)</span>
          {isHost && <span style={{ color: '#f59e0b', fontSize: 13 }}>👑 你是房主</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {room.players.map((p, idx) => (
              <div
                key={p.id}
                className="fade-in"
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: p.id === myId ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                  border: `2px solid ${
                    p.id === myId
                      ? 'rgba(16, 185, 129, 0.4)'
                      : 'var(--border-color)'
                  }`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  animationDelay: `${idx * 0.1}s`
                }}
              >
                <div style={{ fontSize: 36 }}>{p.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>
                    {p.nickname}
                    {p.id === room.hostId && (
                      <span style={{ marginLeft: 6, color: '#f59e0b' }}>👑</span>
                    )}
                  </div>
                  {p.id === myId && (
                    <div style={{ fontSize: 12, color: '#10b981' }}>(你)</div>
                  )}
                </div>
              </div>
            ))}
            {Array.from({ length: Math.max(0, 4 - room.players.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)',
                  border: '2px dashed rgba(255,255,255,0.1)',
                  borderStyle: 'dashed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4a5568',
                  minHeight: 72
                }}
              >
                <span style={{ fontSize: 13 }}>等待玩家加入...</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '12px',
              borderRadius: 10,
              background: 'rgba(233, 69, 96, 0.1)',
              color: '#ff8098',
              marginBottom: 16,
              border: '1px solid rgba(233, 69, 96, 0.3)'
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          {!isHost ? (
            <div style={{ flex: 1, textAlign: 'center', padding: 16, color: '#a0aec0' }}>
              等待房主开始游戏...
            </div>
          ) : (
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={room.players.length < 2}
              onClick={handleStart}
            >
              {room.players.length < 2
                ? `至少需要 2 名玩家 (${room.players.length}/2)`
                : `🚀 开始对战 (${room.players.length}人) 🏆`}
            </button>
          )}
        </div>
      </div>

      {teamsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => {}}
        >
          <div className="card fade-in" style={{ maxWidth: 600, width: '90%' }}>
            <h2
              style={{
                textAlign: 'center',
                fontSize: 28,
                fontWeight: 800,
                marginBottom: 24,
                background: 'linear-gradient(90deg, #e94560, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              🎮 队伍已分配！
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${teamsModal.length}, 1fr)`,
                gap: 16
              }}
            >
              {teamsModal.map((team, idx) => (
                <div
                  key={team.id}
                  className="fade-in"
                  style={{
                    animationDelay: `${idx * 0.2}s`,
                    animation: 'flipCard 0.8s ease forwards',
                    opacity: 0,
                    padding: 20,
                    borderRadius: 16,
                    background: `linear-gradient(135deg, ${['#e94560', '#0f3460', '#f59e0b', '#10b981'][idx % 4]}22, transparent)`,
                    border: `2px solid ${['#e94560', '#0f3460', '#f59e0b', '#10b981'][idx % 4]}66`,
                    perspective: '1000px'
                  }}
                >
                  <h3
                    style={{
                      textAlign: 'center',
                      marginBottom: 16,
                      color: ['#e94560', '#0f3460', '#f59e0b', '#10b981'][idx % 4],
                      fontSize: 20,
                      fontWeight: 800
                    }}
                  >
                    {team.name}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {team.players.map((p) => (
                      <div
                        key={p.id}
                        className="fade-in"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: 12,
                          borderRadius: 12,
                          background: 'rgba(255,255,255,0.05)'
                        }}
                      >
                        <div style={{ fontSize: 32 }}>{p.avatar}</div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{p.nickname}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 20, color: '#a0aec0' }}>
              即将开始游戏...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Room;