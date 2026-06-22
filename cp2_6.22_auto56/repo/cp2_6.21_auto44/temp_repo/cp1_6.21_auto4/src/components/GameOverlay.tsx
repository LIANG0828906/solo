import React from 'react';

interface GameOverlayProps {
  type: 'victory' | 'defeat' | null;
  score: number;
  monstersKilled: number;
  currentWave: number;
  onRestart: () => void;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({
  type,
  score,
  monstersKilled,
  currentWave,
  onRestart,
}) => {
  if (!type) return null;

  const isVictory = type === 'victory';

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h1 style={{ ...styles.title, color: isVictory ? '#4caf50' : '#f44336' }}>
          {isVictory ? '胜利！' : '失败...'}
        </h1>

        <div style={styles.stats}>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>得分</span>
            <span style={styles.statValue}>{score}</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>消灭怪物</span>
            <span style={styles.statValue}>{monstersKilled}</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>到达波次</span>
            <span style={styles.statValue}>{currentWave}</span>
          </div>
        </div>

        <button style={styles.restartButton} onClick={onRestart}>
          再来一局
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  modal: {
    padding: '40px 60px',
    background: 'rgba(26, 26, 46, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: 24,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
    color: '#fff',
  },
  title: {
    fontSize: 48,
    marginBottom: 32,
    textShadow: '0 0 30px currentColor',
  },
  stats: {
    marginBottom: 32,
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 60,
    padding: '8px 0',
    fontSize: 18,
  },
  statLabel: {
    color: '#888',
  },
  statValue: {
    fontWeight: 'bold',
    color: '#fff',
  },
  restartButton: {
    padding: '16px 48px',
    background: 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 4px 20px rgba(66, 165, 245, 0.4)',
  },
};

export default GameOverlay;
