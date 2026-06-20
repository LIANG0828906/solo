import React from 'react';
import { useGameStore } from '../gameLogic/gameState';

interface GameOverMaskProps {
  finalWave: number;
}

const GameOverMask: React.FC<GameOverMaskProps> = ({ finalWave }) => {
  const resetGame = useGameStore((s) => s.resetGame);

  return (
    <div
      style={styles.mask}
      onClick={resetGame}
    >
      <div style={styles.content} onClick={(e) => e.stopPropagation()}>
        <h1 style={styles.title}>游戏结束</h1>
        <p style={styles.subtitle}>能量核心已被摧毁</p>
        <div style={styles.stats}>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>最终波次</span>
            <span style={styles.statValue}>{finalWave}</span>
          </div>
        </div>
        <button
          style={styles.restartBtn}
          onClick={resetGame}
        >
          点击重新开始
        </button>
        <p style={styles.hint}>或点击任意位置重置游戏</p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  mask: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.85) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    cursor: 'pointer',
    backdropFilter: 'blur(4px)',
  },
  content: {
    textAlign: 'center',
    padding: 48,
    backgroundColor: 'rgba(11, 14, 20, 0.95)',
    borderRadius: 16,
    border: '1px solid rgba(30, 58, 95, 0.6)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    maxWidth: 400,
    width: '90%',
  },
  title: {
    color: '#FF3333',
    fontSize: 42,
    fontWeight: 800,
    marginBottom: 8,
    letterSpacing: 4,
    textShadow: '0 0 20px rgba(255, 51, 51, 0.5)',
  },
  subtitle: {
    color: '#8892A6',
    fontSize: 16,
    marginBottom: 32,
  },
  stats: {
    marginBottom: 32,
    display: 'flex',
    justifyContent: 'center',
    gap: 32,
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  statLabel: {
    color: '#8892A6',
    fontSize: 13,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 700,
    textShadow: '0 0 10px rgba(78, 205, 196, 0.4)',
  },
  restartBtn: {
    backgroundColor: '#1E3A5F',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    padding: '14px 32px',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: 12,
    boxShadow: '0 4px 12px rgba(30, 58, 95, 0.4)',
  },
  hint: {
    color: '#555D6E',
    fontSize: 12,
    margin: 0,
  },
};

export default GameOverMask;
