import React, { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';

interface UIPanelProps {
  onRestart: () => void;
}

const UIPanel: React.FC<UIPanelProps> = ({ onRestart }) => {
  const score = useGameStore((s) => s.score);
  const lives = useGameStore((s) => s.lives);
  const isPaused = useGameStore((s) => s.isPaused);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const gameOverOpacity = useGameStore((s) => s.gameOverOpacity);
  const togglePause = useGameStore((s) => s.togglePause);
  const resumeGame = useGameStore((s) => s.resumeGame);

  const handlePauseClick = useCallback(() => {
    togglePause();
  }, [togglePause]);

  const handleResume = useCallback(() => {
    resumeGame();
  }, [resumeGame]);

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 50,
          background: 'rgba(0,0,0,0.6)',
          borderBottomRightRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <svg
              key={i}
              width={16}
              height={16}
              viewBox="0 0 16 16"
              style={{ opacity: i < lives ? 1 : 0.25 }}
            >
              <path
                d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 0 1 8 4a3.5 3.5 0 0 1 5.5 3c0 3.5-5.5 7-5.5 7z"
                fill={i < lives ? '#FF4444' : '#333333'}
              />
            </svg>
          ))}
        </div>

        <button
          onClick={handlePauseClick}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '2px solid #00E5FF',
            background: 'transparent',
            color: '#00E5FF',
            fontSize: 12,
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'monospace',
            textShadow: '0 0 6px rgba(0,229,255,0.5)',
          }}
        >
          ||
        </button>

        <div
          style={{
            color: '#FFFFFF',
            fontSize: 24,
            textShadow: '2px 2px 0 black, 0 0 6px rgba(0,229,255,0.5)',
            fontFamily: 'monospace',
          }}
        >
          {score}
        </div>
      </div>

      {isPaused && !isGameOver && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <div
            style={{
              color: '#FFFFFF',
              fontSize: 36,
              textShadow: '0 0 6px rgba(0,229,255,0.5)',
              fontFamily: 'monospace',
              cursor: 'pointer',
            }}
            onClick={handleResume}
          >
            暂停
          </div>
        </div>
      )}

      {isGameOver && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#000000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 30,
            opacity: gameOverOpacity,
          }}
        >
          <div
            style={{
              fontSize: 48,
              color: '#FF4444',
              fontFamily: 'monospace',
              marginBottom: 16,
            }}
          >
            游戏结束
          </div>
          <div
            style={{
              fontSize: 24,
              color: '#FFFFFF',
              fontFamily: 'monospace',
              marginBottom: 32,
            }}
          >
            得分: {score}
          </div>
          <button
            onClick={onRestart}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.filter = 'brightness(1.2)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.filter = 'brightness(1)';
            }}
            style={{
              width: 120,
              height: 40,
              borderRadius: 8,
              background: '#00E5FF',
              color: '#000000',
              border: 'none',
              fontSize: 16,
              fontFamily: 'monospace',
              cursor: 'pointer',
              transition: 'filter 0.2s',
            }}
          >
            再来一次
          </button>
        </div>
      )}
    </>
  );
};

export default UIPanel;
