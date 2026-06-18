import React from 'react';
import { useGameStore } from '../store';

export const ControlButtons: React.FC = () => {
  const { resetLevel, setView } = useGameStore();

  const base: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid rgba(78,205,196,0.35)',
    background: 'rgba(11,11,43,0.6)',
    backdropFilter: 'blur(4px)',
    color: '#fff',
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 13,
    cursor: 'pointer',
    letterSpacing: 1,
    transition: 'all 0.3s ease',
    zIndex: 5,
  };

  const handleEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'rgba(52,73,94,0.85)';
    e.currentTarget.style.transform = 'translateY(-1px)';
    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.35)';
  };

  const handleLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'rgba(11,11,43,0.6)';
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        display: 'flex',
        gap: 10,
        zIndex: 5,
      }}
    >
      <button
        onClick={resetLevel}
        style={base}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        ↻ 重置关卡
      </button>
      <button
        onClick={() => setView('menu')}
        style={base}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        ← 返回菜单
      </button>
    </div>
  );
};
