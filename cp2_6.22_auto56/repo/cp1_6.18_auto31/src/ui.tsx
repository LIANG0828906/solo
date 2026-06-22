import { useGameStore } from './store';
import { useEffect, useRef, useState } from 'react';

function ScoreDisplay() {
  const score = useGameStore((s) => s.score);
  const displayScore = useGameStore((s) => s.displayScore);
  const tickDisplayScore = useGameStore((s) => s.tickDisplayScore);
  const [prevScore, setPrevScore] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<number>(0);

  useEffect(() => {
    const id = setInterval(tickDisplayScore, 16);
    return () => clearInterval(id);
  }, [tickDisplayScore]);

  useEffect(() => {
    if (score !== prevScore) {
      setAnimating(true);
      setPrevScore(score);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setAnimating(false), 300);
    }
  }, [score, prevScore]);

  return (
    <div style={styles.scoreWrap}>
      <div style={styles.scoreLabel}>SCORE</div>
      <div style={{ position: 'relative', height: 28 }}>
        {animating && (
          <div key={`old-${prevScore}`} style={styles.scoreOld}>
            {String(prevScore).padStart(6, '0')}
          </div>
        )}
        <div
          key={`new-${displayScore}`}
          style={{
            ...styles.scoreNew,
            animation: animating ? 'scoreSlideIn 0.3s ease-out' : undefined,
          }}
        >
          {String(displayScore).padStart(6, '0')}
        </div>
      </div>
      <style>{`
        @keyframes scoreSlideOut {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(12px); opacity: 0; }
        }
        @keyframes scoreSlideIn {
          from { transform: translateY(-12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function ComboDisplay() {
  const combo = useGameStore((s) => s.combo);
  return (
    <div style={styles.comboWrap}>
      <div style={styles.comboLabel}>COMBO</div>
      <div style={styles.comboNum}>{combo}</div>
    </div>
  );
}

function PauseButton() {
  const phase = useGameStore((s) => s.phase);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resumeGame = useGameStore((s) => s.resumeGame);

  const isPaused = phase === 'paused';
  const handleClick = () => {
    if (phase === 'running') pauseGame();
    else if (phase === 'paused') resumeGame();
  };

  return (
    <button
      onClick={handleClick}
      style={{
        ...styles.pauseBtn,
        background: isPaused ? '#E74C3C' : 'rgba(255,255,255,0.1)',
      }}
    >
      {isPaused ? '▶' : '❚❚'}
    </button>
  );
}

function StartOverlay() {
  const startGame = useGameStore((s) => s.startGame);
  const phase = useGameStore((s) => s.phase);
  if (phase !== 'idle') return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.title}>星际回声</div>
      <div style={styles.subtitle}>STAR ECHO</div>
      <button onClick={startGame} style={styles.startBtn}>
        开始游戏
      </button>
      <div style={styles.hint}>WASD / 方向键 移动飞船</div>
    </div>
  );
}

function ScorePanel() {
  const phase = useGameStore((s) => s.phase);
  const score = useGameStore((s) => s.score);
  const notesCollected = useGameStore((s) => s.notesCollected);
  const maxCombo = useGameStore((s) => s.maxCombo);
  const resetGame = useGameStore((s) => s.resetGame);
  const startGame = useGameStore((s) => s.startGame);

  if (phase !== 'gameover') return null;

  const stars = score >= 5000 ? 5 : score >= 3500 ? 4 : score >= 2000 ? 3 : score >= 1000 ? 2 : 1;

  const handleRestart = () => {
    resetGame();
    setTimeout(() => startGame(), 50);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.panelTitle}>游戏结束</div>
        <div style={styles.panelRow}>
          <span>总分</span>
          <span style={styles.panelVal}>{score}</span>
        </div>
        <div style={styles.panelRow}>
          <span>收集音符</span>
          <span style={styles.panelVal}>{notesCollected}</span>
        </div>
        <div style={styles.panelRow}>
          <span>最高连击</span>
          <span style={styles.panelVal}>{maxCombo}</span>
        </div>
        <div style={styles.panelRow}>
          <span>评价</span>
          <span style={styles.panelVal}>
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} style={{ color: i < stars ? '#FFD700' : '#4A4A6E', fontSize: 20 }}>
                ★
              </span>
            ))}
          </span>
        </div>
        <button onClick={handleRestart} style={styles.restartBtn}>
          再来一局
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  scoreWrap: {
    position: 'absolute',
    left: 16,
    top: 16,
    fontFamily: '"Press Start 2P", monospace',
    zIndex: 10,
  },
  scoreLabel: {
    fontSize: 10,
    color: '#8888AA',
    marginBottom: 4,
  },
  scoreOld: {
    position: 'absolute',
    fontSize: 24,
    color: '#FFFFFF',
    animation: 'scoreSlideOut 0.3s ease-out forwards',
  },
  scoreNew: {
    position: 'absolute',
    fontSize: 24,
    color: '#FFFFFF',
  },
  comboWrap: {
    position: 'absolute',
    right: 60,
    top: 16,
    textAlign: 'right',
    fontFamily: '"Press Start 2P", monospace',
    zIndex: 10,
  },
  comboLabel: {
    fontSize: 10,
    color: '#8888AA',
    marginBottom: 4,
  },
  comboNum: {
    fontSize: 20,
    color: '#FFD700',
  },
  pauseBtn: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s ease-out, background 0.2s',
    zIndex: 10,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(10,14,39,0.85)',
    zIndex: 20,
  },
  title: {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 36,
    color: '#FFD700',
    marginBottom: 8,
    textShadow: '0 0 20px rgba(255,215,0,0.5)',
  },
  subtitle: {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 12,
    color: '#6C63FF',
    marginBottom: 40,
    letterSpacing: 4,
  },
  startBtn: {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 14,
    padding: '16px 32px',
    background: '#6C63FF',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'transform 0.2s ease-out, background 0.2s',
  },
  hint: {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 8,
    color: '#8888AA',
    marginTop: 24,
  },
  panel: {
    width: 400,
    background: '#1A1A2E',
    borderRadius: 20,
    border: '1.5px solid #4A4A6E',
    boxShadow: '0 0 30px rgba(100,100,255,0.4)',
    padding: '32px 40px',
    textAlign: 'center',
    fontFamily: '"Press Start 2P", monospace',
  },
  panelTitle: {
    fontSize: 20,
    color: '#FFD700',
    marginBottom: 24,
  },
  panelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 12,
    color: '#AAAACC',
    marginBottom: 16,
  },
  panelVal: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  restartBtn: {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 12,
    width: 120,
    height: 44,
    background: '#6C63FF',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    marginTop: 20,
    transition: 'transform 0.2s ease-out, background 0.2s',
  },
};

export { ScoreDisplay, ComboDisplay, PauseButton, StartOverlay, ScorePanel };
