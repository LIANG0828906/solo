import React, { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../store';

interface Particle {
  id: number;
  dx: number;
  dy: number;
  delay: number;
}

const PARTICLE_COUNT = 30;
const SPREAD_RADIUS = 200;

const RollingNumber: React.FC<{ value: number; intervalMs?: number }> = ({
  value,
  intervalMs = 50,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const digits = Math.max(1, String(Math.floor(value)).length);
  const totalSteps = digits * 20;
  const stepValue = totalSteps > 0 ? value / totalSteps : value;

  useEffect(() => {
    setDisplayValue(0);
    if (value <= 0) return;

    let current = 0;
    const timer = window.setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        window.clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [value, stepValue, intervalMs]);

  return <>{displayValue.toLocaleString()}</>;
};

export const GameOverOverlay: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const score = useGameStore((s) => s.score);
  const maxCombo = useGameStore((s) => s.maxCombo);
  const round = useGameStore((s) => s.round);
  const restart = useGameStore((s) => s.restart);

  const [particles, setParticles] = useState<Particle[]>([]);

  const particlesMemo = useMemo(() => {
    const arr: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.3;
      const r = SPREAD_RADIUS * (0.6 + Math.random() * 0.4);
      arr.push({
        id: i,
        dx: Math.cos(angle) * r,
        dy: Math.sin(angle) * r,
        delay: Math.random() * 0.1,
      });
    }
    return arr;
  }, [phase]);

  useEffect(() => {
    if (phase === 'game_over') {
      setParticles(particlesMemo);
    }
  }, [phase, particlesMemo]);

  if (phase !== 'game_over') return null;

  return (
    <div className="game-over-overlay">
      <div className="game-over-card">
        <div className="particle-container">
          {particles.map((p) => (
            <div
              key={p.id}
              className="particle"
              style={{
                animationDelay: `${p.delay}s`,
                ['--dx' as string]: `${p.dx}px`,
                ['--dy' as string]: `${p.dy}px`,
              }}
            />
          ))}
        </div>

        <h1 className="game-over-title">游戏结束</h1>
        <p className="game-over-subtitle">Game Over</p>

        <div className="game-over-stats">
          <div className="stat-row">
            <span className="stat-label">最终得分</span>
            <span className="stat-value score">
              <RollingNumber value={score} />
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">最高连击</span>
            <span className="stat-value">x{maxCombo}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">坚持轮次</span>
            <span className="stat-value">{round}</span>
          </div>
        </div>

        <button className="restart-btn" onClick={restart}>
          重新开始
        </button>
      </div>
    </div>
  );
};

export default GameOverOverlay;
