import React from 'react';
import { useGameStore } from '../game/store';
import { loadLevel, getLevelCount } from '../game/levelModule';
import { Particle } from '../game/types';

export function MainMenu() {
  const store = useGameStore();

  const startGame = () => {
    const level = loadLevel(1);
    if (level) {
      store.dispatch({ type: 'SET_LEVEL', level });
      store.dispatch({ type: 'SET_PHASE', phase: 'playing' });
    }
  };

  const goToLevelSelect = () => {
    store.dispatch({ type: 'SET_PHASE', phase: 'levelSelect' });
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>影 途</h1>
      <p style={styles.subtitle}>SHADOW PATH</p>
      <p style={styles.description}>操纵光影，以影为桥，穿越幽暗</p>
      <div style={styles.buttonGroup}>
        <button style={styles.button} onClick={startGame}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#2A2A4E'; e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1A2E'; e.currentTarget.style.transform = 'scale(1)'; }}>
          开始游戏
        </button>
        <button style={styles.button} onClick={goToLevelSelect}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#2A2A4E'; e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1A2E'; e.currentTarget.style.transform = 'scale(1)'; }}>
          选择关卡
        </button>
      </div>
      <p style={styles.hint}>操作：WASD移动 / 空格跳跃 / 左键拖拽释放影子 / 右键删除影子 / R重试</p>
    </div>
  );
}

export function LevelSelect() {
  const store = useGameStore();
  const count = getLevelCount();

  const selectLevel = (index: number) => {
    const level = loadLevel(index);
    if (level) {
      store.dispatch({ type: 'SET_LEVEL', level });
      store.dispatch({ type: 'SET_PHASE', phase: 'playing' });
    }
  };

  const goBack = () => {
    store.dispatch({ type: 'SET_PHASE', phase: 'menu' });
  };

  const levels = [];
  for (let i = 1; i <= count; i++) {
    const level = loadLevel(i);
    const completed = store.progress.completedLevels.includes(i);
    levels.push(
      <div
        key={i}
        style={styles.card}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        onClick={() => selectLevel(i)}
      >
        <div style={styles.cardPreview}>
          <span style={styles.cardNumber}>{i}</span>
          {completed && <span style={styles.completed}>✓</span>}
        </div>
        <p style={styles.cardName}>{level?.name || `关卡 ${i}`}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.sectionTitle}>选择关卡</h2>
      <div style={styles.grid}>{levels}</div>
      <button style={styles.button} onClick={goBack}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#2A2A4E'; e.currentTarget.style.transform = 'scale(1.05)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1A2E'; e.currentTarget.style.transform = 'scale(1)'; }}>
        返回
      </button>
    </div>
  );
}

export function GameOverScreen() {
  const store = useGameStore();

  const retry = () => {
    store.dispatch({ type: 'RESET_LEVEL' });
    store.dispatch({ type: 'SET_PHASE', phase: 'playing' });
  };

  const goToMenu = () => {
    store.dispatch({ type: 'SET_PHASE', phase: 'menu' });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.overlayBox}>
        <h2 style={{ ...styles.sectionTitle, color: '#FF0044' }}>影散魂消</h2>
        <p style={styles.description}>你的光芒消逝在黑暗中...</p>
        <div style={styles.buttonGroup}>
          <button style={styles.button} onClick={retry}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2A2A4E'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1A2E'; e.currentTarget.style.transform = 'scale(1)'; }}>
            重新尝试
          </button>
          <button style={styles.button} onClick={goToMenu}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2A2A4E'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1A2E'; e.currentTarget.style.transform = 'scale(1)'; }}>
            返回主菜单
          </button>
        </div>
      </div>
    </div>
  );
}

export function VictoryScreen() {
  const store = useGameStore();
  const [particles, setParticles] = React.useState<Particle[]>([]);

  React.useEffect(() => {
    const ps: Particle[] = [];
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#DDA0DD', '#FF8C42'];
    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 300 + 100;
      ps.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.8,
        maxLife: 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2,
      });
    }
    setParticles(ps);

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * 0.016,
            y: p.y + p.vy * 0.016,
            vy: p.vy + 300 * 0.016,
            life: p.life - 0.016,
          }))
          .filter((p) => p.life > 0)
      );
    }, 16);

    return () => clearInterval(interval);
  }, []);

  const elapsed = ((Date.now() - store.stats.startTime) / 1000).toFixed(1);
  const baseScore = 1000;
  const timePenalty = Math.floor((Date.now() - store.stats.startTime) / 1000) * 5;
  const shadowPenalty = store.stats.shadowPlacements * 50;
  const score = Math.max(100, baseScore - timePenalty - shadowPenalty);

  const nextLevel = () => {
    const next = store.progress.currentLevel + 1;
    const level = loadLevel(next);
    if (level) {
      store.dispatch({ type: 'SET_LEVEL', level });
      store.dispatch({ type: 'SET_PHASE', phase: 'playing' });
    } else {
      store.dispatch({ type: 'SET_PHASE', phase: 'menu' });
    }
  };

  const goToMenu = () => {
    store.dispatch({ type: 'SET_PHASE', phase: 'menu' });
  };

  return (
    <div style={styles.overlay}>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            backgroundColor: p.color,
            opacity: p.life / p.maxLife,
            pointerEvents: 'none',
          }}
        />
      ))}
      <div style={styles.overlayBox}>
        <h2 style={{ ...styles.sectionTitle, color: '#FFD700' }}>光影交汇</h2>
        <div style={styles.scoreContainer}>
          <p style={styles.scoreLine}>用时: <span style={{ color: '#4ECDC4' }}>{elapsed}s</span></p>
          <p style={styles.scoreLine}>影子放置: <span style={{ color: '#96E6A1' }}>{store.stats.shadowPlacements}次</span></p>
          <p style={styles.scoreTitle}>得分: <span style={{ color: '#FFD700', fontSize: 28 }}>{score}</span></p>
        </div>
        <div style={styles.buttonGroup}>
          {loadLevel(store.progress.currentLevel + 1) && (
            <button style={styles.button} onClick={nextLevel}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#2A2A4E'; e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1A2E'; e.currentTarget.style.transform = 'scale(1)'; }}>
              下一关
            </button>
          )}
          <button style={styles.button} onClick={goToMenu}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2A2A4E'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1A2E'; e.currentTarget.style.transform = 'scale(1)'; }}>
            返回主菜单
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    fontFamily: "'Georgia', serif",
    color: '#E0E0E0',
    background: 'linear-gradient(180deg, #0F0F1A 0%, #1A1A2E 100%)',
    padding: 20,
  },
  title: {
    fontSize: 64,
    fontWeight: 'bold',
    letterSpacing: 16,
    color: '#E0E0E0',
    marginBottom: 8,
    textShadow: '0 0 30px rgba(255,255,255,0.15)',
  },
  subtitle: {
    fontSize: 18,
    letterSpacing: 8,
    color: '#888899',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#888899',
    marginBottom: 32,
    textAlign: 'center' as const,
  },
  hint: {
    fontSize: 12,
    color: '#555566',
    marginTop: 24,
    textAlign: 'center' as const,
  },
  buttonGroup: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },
  button: {
    padding: '12px 32px',
    fontSize: 16,
    fontFamily: "'Georgia', serif",
    color: '#E0E0E0',
    background: '#1A1A2E',
    border: '1px solid #333355',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
    minWidth: 120,
  },
  sectionTitle: {
    fontSize: 28,
    color: '#E0E0E0',
    marginBottom: 24,
    textAlign: 'center' as const,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
    marginBottom: 24,
  },
  card: {
    width: 160,
    background: '#1A1A2E',
    border: '1px solid #333355',
    borderRadius: 8,
    padding: 12,
    cursor: 'pointer',
    transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out',
    textAlign: 'center' as const,
  },
  cardPreview: {
    width: '100%',
    height: 80,
    background: '#0F0F1A',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative' as const,
  },
  cardNumber: {
    fontSize: 32,
    color: '#444466',
    fontFamily: "'Georgia', serif",
  },
  completed: {
    position: 'absolute' as const,
    top: 4,
    right: 8,
    color: '#00FF88',
    fontSize: 18,
  },
  cardName: {
    fontSize: 14,
    color: '#E0E0E0',
    fontFamily: "'Georgia', serif",
  },
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(15, 15, 26, 0.85)',
    backdropFilter: 'blur(8px)',
    zIndex: 100,
  },
  overlayBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: 40,
    background: 'rgba(26, 26, 46, 0.95)',
    borderRadius: 12,
    border: '1px solid #333355',
  },
  scoreContainer: {
    marginBottom: 24,
    textAlign: 'center' as const,
  },
  scoreLine: {
    fontSize: 16,
    color: '#E0E0E0',
    marginBottom: 8,
  },
  scoreTitle: {
    fontSize: 20,
    color: '#E0E0E0',
    marginTop: 12,
  },
};
