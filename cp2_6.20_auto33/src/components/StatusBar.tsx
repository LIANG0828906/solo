import React, { useEffect, useState } from 'react';
import type { Pet } from '../types';

interface StatProps {
  label: string;
  icon: string;
  value: number;
  gradient: string;
  warning?: boolean;
}

const AnimatedNumber: React.FC<{ value: number; color: string }> = ({ value, color }) => {
  const [display, setDisplay] = useState(value);
  const [jump, setJump] = useState(false);
  useEffect(() => {
    const start = display;
    const delta = value - start;
    if (Math.abs(delta) < 0.01) return;
    const startTime = performance.now();
    const dur = 500;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - startTime) / dur);
      setDisplay(start + delta * p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    setJump(true);
    const to = setTimeout(() => setJump(false), 400);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(to);
    };
  }, [value]);
  return (
    <span style={{
      display: 'inline-block',
      fontWeight: 700,
      color,
      fontSize: 13,
      animation: jump ? 'num-jump 0.4s ease' : 'none',
      fontVariantNumeric: 'tabular-nums',
      minWidth: 30,
      textAlign: 'right',
    }}>
      {Math.round(display)}
    </span>
  );
};

const StatBar: React.FC<StatProps> = ({ label, icon, value, gradient, warning }) => {
  return (
    <div className="stat-item" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#5D4037' }}>
          <span style={{ fontSize: 15 }}>{icon}</span>
          <span className="stat-label">{label}</span>
        </div>
        <AnimatedNumber value={value} color={warning ? '#E53935' : '#5D4037'} />
      </div>
      <div className={`progress-bar-track ${warning ? 'warning-pulse' : ''}`}>
        <div
          className="progress-bar-fill"
          style={{
            width: `${Math.max(0, Math.min(100, value))}%`,
            background: gradient,
          }}
        />
      </div>
    </div>
  );
};

interface Props {
  pet: Pet;
}

export const StatusBar: React.FC<Props> = ({ pet }) => {
  const hungerWarn = pet.hunger <= 25;
  const happyWarn = pet.happiness <= 25;
  const cleanWarn = pet.cleanliness <= 25;
  const energyWarn = pet.energy <= 20;

  return (
    <div className="status-bar" style={{
      width: '100%',
      display: 'flex',
      gap: 14,
      padding: '14px 18px',
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(8px)',
      borderRadius: 20,
      boxShadow: 'var(--shadow-soft)',
      border: '2px solid rgba(255,255,255,0.8)',
    }}>
      <StatBar label="饥饿" icon="🍗" value={pet.hunger} gradient="var(--hunger-gradient)" warning={hungerWarn} />
      <StatBar label="快乐" icon="😊" value={pet.happiness} gradient="var(--happiness-gradient)" warning={happyWarn} />
      <StatBar label="清洁" icon="🛁" value={pet.cleanliness} gradient="var(--cleanliness-gradient)" warning={cleanWarn} />
      <StatBar label="体力" icon="⚡" value={pet.energy} gradient="var(--energy-gradient)" warning={energyWarn} />
    </div>
  );
};

export default StatusBar;
