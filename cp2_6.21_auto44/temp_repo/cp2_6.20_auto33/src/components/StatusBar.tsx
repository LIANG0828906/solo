import React, { useEffect, useState, useMemo } from 'react';
import type { Pet } from '../types';

const keyframesStyle = `
  @keyframes num-jump {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
  }
  @keyframes warning-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; filter: brightness(1.3); }
  }
  @keyframes warning-text-blink {
    0%, 100% { opacity: 1; color: #E53935; }
    50% { opacity: 0.6; color: #FF1744; }
  }
`;

interface StatConfig {
  label: string;
  icon: string;
  gradient: string;
  value: number;
  warning: boolean;
}

const AnimatedNumber: React.FC<{ value: number; warning: boolean }> = ({ value, warning }) => {
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

  const textColor = warning ? '#E53935' : '#5D4037';

  return (
    <span
      style={{
        display: 'inline-block',
        fontWeight: 700,
        color: textColor,
        fontSize: 13,
        animation: warning
          ? 'warning-text-blink 0.6s ease-in-out infinite'
          : jump
          ? 'num-jump 0.4s ease'
          : 'none',
        fontVariantNumeric: 'tabular-nums',
        minWidth: 30,
        textAlign: 'right',
      }}
    >
      {Math.round(display)}
    </span>
  );
};

const StatBar: React.FC<{ config: StatConfig }> = ({ config }) => {
  const { label, icon, gradient, value, warning } = config;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const progressValue = Math.max(0, Math.min(100, value));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
            fontWeight: 600,
            color: '#5D4037',
          }}
        >
          <span style={{ fontSize: 15 }}>{icon}</span>
          {!isMobile && <span>{label}</span>}
        </div>
        <AnimatedNumber value={value} warning={warning} />
      </div>
      <div
        style={{
          height: isMobile ? 16 : 20,
          background: 'rgba(255, 255, 255, 0.6)',
          borderRadius: 999,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.08)',
          animation: warning ? 'warning-blink 0.6s ease-in-out infinite' : 'none',
        }}
      >
        <div
          style={{
            width: `${progressValue}%`,
            height: '100%',
            borderRadius: 999,
            background: gradient,
            transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '45%',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 100%)',
              borderRadius: '999px 999px 0 0',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
};

interface Props {
  pet: Pet;
}

export const StatusBar: React.FC<Props> = ({ pet }) => {
  const statConfigs = useMemo<StatConfig[]>(
    () => [
      {
        label: '饥饿',
        icon: '🍗',
        gradient: 'linear-gradient(90deg, #FF6B6B 0%, #FFA94D 50%, #FFE066 100%)',
        value: pet.hunger,
        warning: pet.hunger <= 25,
      },
      {
        label: '快乐',
        icon: '😊',
        gradient: 'linear-gradient(90deg, #74C0FC 0%, #339AF0 50%, #1C7ED6 100%)',
        value: pet.happiness,
        warning: pet.happiness <= 25,
      },
      {
        label: '清洁',
        icon: '🛁',
        gradient: 'linear-gradient(90deg, #E599F7 0%, #CC5DE8 50%, #AE3EC9 100%)',
        value: pet.cleanliness,
        warning: pet.cleanliness <= 25,
      },
      {
        label: '体力',
        icon: '⚡',
        gradient: 'linear-gradient(90deg, #69DB7C 0%, #40C057 50%, #2F9E44 100%)',
        value: pet.energy,
        warning: pet.energy <= 20,
      },
    ],
    [pet.hunger, pet.happiness, pet.cleanliness, pet.energy]
  );

  return (
    <>
      <style>{keyframesStyle}</style>
      <div
        style={{
          width: '100%',
          display: 'flex',
          gap: 14,
          padding: '14px 18px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(8px)',
          borderRadius: 20,
          boxShadow: '0 4px 16px rgba(255, 170, 80, 0.15)',
          border: '2px solid rgba(255,255,255,0.8)',
        }}
      >
        {statConfigs.map((config, index) => (
          <StatBar key={index} config={config} />
        ))}
      </div>
    </>
  );
};

export default StatusBar;
