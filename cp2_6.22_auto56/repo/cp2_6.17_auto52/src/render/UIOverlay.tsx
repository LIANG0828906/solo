import React from 'react';
import { useGameStore } from '../store';
import { MAX_BALLS } from '../physics/types';

const UIOverlay: React.FC = () => {
  const score = useGameStore((s) => s.score);
  const lives = useGameStore((s) => s.lives);
  const balls = useGameStore((s) => s.balls);
  const gameOver = useGameStore((s) => s.gameOver);
  const performance = useGameStore((s) => s.performance);
  const addBall = useGameStore((s) => s.addBall);
  const reset = useGameStore((s) => s.reset);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: '4px 12px', color: '#fff', fontSize: 18, fontWeight: 600 }}>
        ⚽ {balls.length}
      </div>

      <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(22,33,62,0.85)', borderRadius: 8, padding: '8px 14px', color: '#fff', fontSize: 12, lineHeight: 1.8 }}>
        <div>FPS: {performance.fps}</div>
        <div>粒子: {performance.particleCount}</div>
        <div>碰撞耗时: {performance.avgCollisionTime}ms</div>
      </div>

      <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto' }}>
        <button
          onClick={addBall}
          disabled={balls.length >= MAX_BALLS}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: balls.length >= MAX_BALLS ? '#555' : '#0F3460',
            color: '#fff',
            fontSize: 22,
            fontWeight: 700,
            cursor: balls.length >= MAX_BALLS ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            if (balls.length < MAX_BALLS) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#143d75';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = balls.length >= MAX_BALLS ? '#555' : '#0F3460';
          }}
        >
          +
        </button>
      </div>

      <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 16, pointerEvents: 'none' }}>
        <span style={{ color: '#fff', fontSize: 24, fontWeight: 700, textShadow: '0 0 10px rgba(233,69,96,0.5)' }}>
          {score}
        </span>
        <span style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              style={{
                fontSize: 20,
                opacity: i < lives ? 1 : 0.2,
                transition: 'opacity 0.3s',
                filter: i < lives ? 'drop-shadow(0 0 4px #E94560)' : 'none',
              }}
            >
              ❤️
            </span>
          ))}
        </span>
      </div>

      {gameOver && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.5s ease',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ color: '#E94560', fontSize: 48, fontWeight: 900, marginBottom: 8, textShadow: '0 0 20px rgba(233,69,96,0.6)' }}>
            GAME OVER
          </div>
          <div style={{ color: '#fff', fontSize: 24, marginBottom: 24, fontWeight: 600 }}>
            最终得分: {score}
          </div>
          <button
            onClick={reset}
            style={{
              padding: '12px 36px',
              fontSize: 18,
              fontWeight: 700,
              border: '2px solid #E94560',
              borderRadius: 8,
              background: 'transparent',
              color: '#E94560',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#E94560';
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = '#E94560';
            }}
          >
            重新开始
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default UIOverlay;
