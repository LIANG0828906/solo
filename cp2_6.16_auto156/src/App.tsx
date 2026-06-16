import React from 'react';
import GameCanvas from './GameCanvas';
import { useGameState } from './useGameState';

const hudStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  left: 16,
  background: 'rgba(11, 12, 16, 0.65)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  borderRadius: 8,
  padding: '14px 18px',
  color: '#fff',
  fontFamily: "'Segoe UI', 'PingFang SC', sans-serif",
  fontSize: 13,
  minWidth: 200,
  border: '1px solid rgba(255,255,255,0.08)',
  pointerEvents: 'none',
  zIndex: 10,
};

const barContainerStyle: React.CSSProperties = {
  width: '100%',
  height: 10,
  borderRadius: 5,
  background: 'rgba(255,255,255,0.1)',
  overflow: 'hidden',
  marginTop: 3,
  marginBottom: 8,
};

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={barContainerStyle}>
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 5,
          background: color,
          transition: 'width 0.15s ease',
        }}
      />
    </div>
  );
}

function HUD() {
  const fuel = useGameState((s) => s.fuel);
  const shield = useGameState((s) => s.shield);
  const cargo = useGameState((s) => s.cargo);
  const maxCargo = useGameState((s) => s.maxCargo);
  const timeRemaining = useGameState((s) => s.timeRemaining);

  const mins = Math.floor(timeRemaining / 60);
  const secs = Math.floor(timeRemaining % 60);
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  const isLow = timeRemaining < 30;

  return (
    <div style={hudStyle}>
      <div style={{ marginBottom: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>⛽ 燃料</span>
        <span style={{ fontSize: 11, opacity: 0.7 }}>{fuel.toFixed(1)}%</span>
      </div>
      <Bar value={fuel} max={100} color="#FFD700" />

      <div style={{ marginBottom: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>📦 货舱</span>
        <span style={{ fontSize: 11, opacity: 0.7 }}>{cargo.length}/{maxCargo}</span>
      </div>
      <Bar value={cargo.length} max={maxCargo} color="#3498DB" />

      <div style={{ marginBottom: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🛡 护盾</span>
        <span style={{ fontSize: 11, opacity: 0.7 }}>{shield.toFixed(1)}%</span>
      </div>
      <Bar value={shield} max={100} color="#2ECC71" />

      <div style={{ marginTop: 4, textAlign: 'center', fontSize: 16, fontWeight: 700, fontFamily: 'monospace',
        color: isLow ? '#ff4444' : '#fff',
        animation: isLow ? 'blink 0.5s ease-in-out infinite alternate' : 'none',
      }}>
        ⏱ {timeStr}
      </div>
    </div>
  );
}

function ControlHint() {
  const timer = useGameState((s) => s.controlHintTimer);
  if (timer <= 0) return null;
  const opacity = Math.min(1, timer / 0.5);
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 60,
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#fff',
        fontSize: 18,
        fontFamily: "'Segoe UI', 'PingFang SC', sans-serif",
        opacity,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none',
        textShadow: '0 0 10px rgba(0,255,100,0.5)',
        zIndex: 10,
      }}
    >
      WASD移动，空格键采矿
    </div>
  );
}

function getRating(score: number): { grade: string; color: string } {
  if (score >= 800) return { grade: 'S', color: '#FFD700' };
  if (score >= 500) return { grade: 'A', color: '#2ECC71' };
  if (score >= 200) return { grade: 'B', color: '#3498DB' };
  return { grade: 'C', color: '#95A5A6' };
}

function GameOverModal() {
  const gameOver = useGameState((s) => s.gameOver);
  const cargo = useGameState((s) => s.cargo);
  const fuel = useGameState((s) => s.fuel);
  const shield = useGameState((s) => s.shield);
  const restartGame = useGameState((s) => s.restartGame);

  if (!gameOver) return null;

  const normalCount = cargo.filter((c) => c.type === 'normal').length;
  const rareCount = cargo.filter((c) => c.type === 'rare').length;
  const score = normalCount * 10 + rareCount * 50;
  const { grade, color } = getRating(score);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
      }}
    >
      <div
        style={{
          background: 'rgba(11, 12, 16, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: 16,
          padding: '36px 48px',
          color: '#fff',
          fontFamily: "'Segoe UI', 'PingFang SC', sans-serif",
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.1)',
          minWidth: 320,
          animation: 'fadeIn 0.5s ease',
        }}
      >
        <h2 style={{ margin: '0 0 20px 0', fontSize: 22, fontWeight: 600, letterSpacing: 2 }}>任务结算</h2>

        <div style={{ fontSize: 14, lineHeight: 2, color: '#ccc' }}>
          <div>普通矿物: <span style={{ color: '#BDC3C7' }}>{normalCount}</span> 单位</div>
          <div>稀有矿物: <span style={{ color: '#BB8FCE' }}>{rareCount}</span> 单位</div>
          <div style={{ marginTop: 8, fontSize: 16, color: '#fff' }}>
            总价值: <strong>{score}</strong> 分
          </div>
          <div style={{ marginTop: 4, fontSize: 12 }}>
            剩余燃料: {fuel.toFixed(1)}% | 剩余护盾: {shield.toFixed(1)}%
          </div>
        </div>

        <div style={{ marginTop: 24, animation: 'fadeIn 0.8s ease' }}>
          <div style={{ fontSize: 48, fontWeight: 900, color, lineHeight: 1.2, animation: 'ratingIn 0.6s ease' }}>
            {grade}
          </div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>评级</div>
        </div>

        <button
          onClick={restartGame}
          style={{
            marginTop: 28,
            padding: '10px 36px',
            border: 'none',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #2980B9, #3498DB)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'filter 0.2s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget.style.filter = 'brightness(1.2)'); }}
          onMouseLeave={(e) => { (e.currentTarget.style.filter = 'brightness(1)'); }}
        >
          重新开始
        </button>
      </div>
    </div>
  );
}

const App: React.FC = () => {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <style>{`
        @keyframes blink {
          from { opacity: 1; }
          to { opacity: 0.3; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ratingIn {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <GameCanvas />
      <HUD />
      <ControlHint />
      <GameOverModal />
    </div>
  );
};

export default App;
