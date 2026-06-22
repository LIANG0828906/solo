import React, { useState } from 'react';
import { useRoomStore } from '@/store/roomStore';

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    background: 'linear-gradient(135deg, #1A0530 0%, #2D1B69 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    overflow: 'hidden',
    position: 'relative',
  },
  title: {
    color: '#FFFFFF',
    fontSize: '42px',
    fontWeight: 700,
    marginBottom: '8px',
    opacity: 0,
    animation: 'fadeIn 0.6s ease forwards',
    animationDelay: '0.1s',
    letterSpacing: '4px',
    textShadow: '0 0 30px rgba(107, 203, 119, 0.3)',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '16px',
    marginBottom: '48px',
    opacity: 0,
    animation: 'fadeIn 0.6s ease forwards',
    animationDelay: '0.2s',
    letterSpacing: '2px',
  },
  input: {
    width: '320px',
    height: '48px',
    borderRadius: '12px',
    background: '#1E1E2E',
    border: '1px solid #3A3A5C',
    color: '#FFFFFF',
    fontSize: '16px',
    padding: '0 20px',
    outline: 'none',
    marginBottom: '24px',
    opacity: 0,
    animation: 'fadeIn 0.6s ease forwards',
    animationDelay: '0.3s',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    textAlign: 'center',
    letterSpacing: '3px',
  },
  inputFocus: {
    borderColor: '#6BCB77',
    boxShadow: '0 0 0 3px rgba(107, 203, 119, 0.15)',
  },
  btnRow: {
    display: 'flex',
    gap: '16px',
    opacity: 0,
    animation: 'fadeIn 0.6s ease forwards',
    animationDelay: '0.4s',
  },
  btnCreate: {
    width: '140px',
    height: '44px',
    borderRadius: '8px',
    background: '#6BCB77',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
    boxShadow: '0 4px 12px rgba(107, 203, 119, 0.3)',
    letterSpacing: '1px',
  },
  btnJoin: {
    width: '140px',
    height: '44px',
    borderRadius: '8px',
    background: '#4ECDC4',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
    boxShadow: '0 4px 12px rgba(78, 205, 196, 0.3)',
    letterSpacing: '1px',
  },
  error: {
    color: '#FF6B6B',
    fontSize: '14px',
    marginTop: '16px',
    opacity: 0,
    animation: 'fadeIn 0.4s ease forwards',
    animationDelay: '0.5s',
  },
  loading: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px',
    marginTop: '16px',
    opacity: 0,
    animation: 'fadeIn 0.4s ease forwards',
    animationDelay: '0.5s',
  },
  bgParticles: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
};

export const HomePage: React.FC = () => {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const { createRoom, joinRoom, isLoading, error } = useRoomStore();

  const handleCreate = async () => {
    await createRoom();
  };

  const handleJoin = async () => {
    if (!roomIdInput.trim()) return;
    await joinRoom(roomIdInput.trim());
  };

  const getBtnStyle = (base: React.CSSProperties, btnKey: string, hoverShadow: string) => ({
    ...base,
    ...(hoveredBtn === btnKey
      ? {
          transform: 'translateY(-2px)',
          boxShadow: hoverShadow,
          filter: 'brightness(0.92)',
        }
      : {}),
  });

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.1); opacity: 0.6; }
        }
      `}</style>

      <div style={styles.bgParticles}>
        {Array.from({ length: 20 }).map((_, i) => {
          const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCB77'];
          const size = 4 + Math.random() * 8;
          const left = Math.random() * 100;
          const top = Math.random() * 100;
          const delay = Math.random() * 5;
          const duration = 4 + Math.random() * 4;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${left}%`,
                top: `${top}%`,
                width: size,
                height: size,
                borderRadius: '50%',
                background: colors[i % colors.length],
                opacity: 0.3,
                animation: `float ${duration}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
                filter: 'blur(1px)',
              }}
            />
          );
        })}
      </div>

      <h1 style={styles.title}>幻境投票机</h1>
      <p style={styles.subtitle}>✦ 创造属于你的实时视觉票选 ✦</p>

      <input
        style={{
          ...styles.input,
          ...(inputFocused ? styles.inputFocus : {}),
        }}
        placeholder="输入房间ID"
        value={roomIdInput}
        onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
        onFocus={() => setInputFocused(true)}
        onBlur={() => setInputFocused(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleJoin();
        }}
      />

      <div style={styles.btnRow}>
        <button
          style={getBtnStyle(styles.btnCreate, 'create', '0 8px 24px rgba(107, 203, 119, 0.45)')}
          onMouseEnter={() => setHoveredBtn('create')}
          onMouseLeave={() => setHoveredBtn(null)}
          onClick={handleCreate}
          disabled={isLoading}
        >
          创建房间
        </button>
        <button
          style={getBtnStyle(styles.btnJoin, 'join', '0 8px 24px rgba(78, 205, 196, 0.45)')}
          onMouseEnter={() => setHoveredBtn('join')}
          onMouseLeave={() => setHoveredBtn(null)}
          onClick={handleJoin}
          disabled={isLoading || !roomIdInput.trim()}
        >
          加入房间
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {isLoading && <div style={styles.loading}>加载中...</div>}
    </div>
  );
};
