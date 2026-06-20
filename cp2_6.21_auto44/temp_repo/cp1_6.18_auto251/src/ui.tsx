import React from 'react';
import { useMazeStore } from './store';

const hudStyle: React.CSSProperties = {
  position: 'absolute',
  top: 20,
  left: 20,
  color: '#FFFFFF',
  fontSize: 18,
  fontWeight: 600,
  textShadow: '0 0 10px rgba(0, 229, 255, 0.8), 0 0 20px rgba(0, 229, 255, 0.4)',
  zIndex: 10,
  userSelect: 'none',
  lineHeight: 1.8,
};

const buttonStyle: React.CSSProperties = {
  position: 'absolute',
  top: 20,
  right: 20,
  width: 50,
  height: 50,
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.08)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  color: '#FFFFFF',
  fontSize: 20,
  cursor: 'pointer',
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s ease',
  outline: 'none',
};

const buttonHoverStyle: React.CSSProperties = {
  border: '1px solid rgba(0, 229, 255, 0.8)',
  boxShadow: '0 0 15px rgba(0, 229, 255, 0.6)',
};

export function UI() {
  const countdown = useMazeStore(s => s.countdown);
  const collectedCount = useMazeStore(s => s.collectedCount);
  const totalFragments = useMazeStore(s => s.totalFragments);
  const resetGame = useMazeStore(s => s.resetGame);
  const [hovered, setHovered] = React.useState(false);

  return (
    <>
      <div style={hudStyle}>
        <div>重组倒计时: {Math.ceil(countdown)}s</div>
        <div>能量碎片: {collectedCount} / {totalFragments}</div>
      </div>
      <button
        style={{ ...buttonStyle, ...(hovered ? buttonHoverStyle : {}) }}
        onClick={resetGame}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="重新开始"
      >
        ↻
      </button>
    </>
  );
}
