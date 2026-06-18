import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';

export default function VictoryScreen() {
  const { gameStatus, timeElapsed, initGame } = useGameStore();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (gameStatus === 'victory') {
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [gameStatus]);

  if (gameStatus !== 'victory') return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(13, 5, 24, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '8px',
      }}
    >
      <div
        style={{
          opacity: showContent ? 1 : 0,
          transition: 'opacity 1s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: '36px',
            color: '#FFD700',
            fontWeight: 'bold',
          }}
        >
          通关
        </div>
        <div
          style={{
            fontSize: '20px',
            color: '#E8E0FF',
            marginTop: '16px',
          }}
        >
          用时：{timeElapsed.toFixed(1)}s
        </div>
        <button
          onClick={initGame}
          style={{
            borderRadius: '8px',
            background: '#FF6B6B',
            color: 'white',
            padding: '12px 32px',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '32px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#FF4466';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#FF6B6B';
          }}
        >
          再来一局
        </button>
      </div>
    </div>
  );
}
