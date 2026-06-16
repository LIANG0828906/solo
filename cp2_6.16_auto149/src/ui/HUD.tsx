import React from 'react';
import { useGameStore } from '../store/gameStore';
import type { CargoType } from '../types';

const cargoIcons: Record<CargoType, string> = {
  crystal: '💎',
  ore: '🪨',
  biosample: '🧬',
};

const cargoColors: Record<CargoType, string> = {
  crystal: '#44aaff',
  ore: '#cc8844',
  biosample: '#44cc88',
};

function ShieldRing({ value }: { value: number }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value / 100);
  const ratio = value / 100;
  const color = ratio > 0.5 ? '#00ffaa' : ratio > 0.25 ? '#ffaa00' : '#ff3344';
  const pulse = 1 + 0.05 * Math.sin(Date.now() / 200);

  return (
    <svg width={70} height={70} style={{ transform: `scale(${pulse})`, transition: 'transform 0.1s' }}>
      <circle cx={35} cy={35} r={r} fill="none" stroke="rgba(192,200,216,0.15)" strokeWidth={4} />
      <circle
        cx={35}
        cy={35}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 35 35)"
        style={{ transition: 'stroke-dashoffset 0.3s, stroke 0.3s', filter: `drop-shadow(0 0 6px ${color})` }}
      />
      <text x={35} y={40} textAnchor="middle" fill="#C0C8D8" fontSize={14} fontWeight="bold">
        {Math.round(value)}%
      </text>
    </svg>
  );
}

function DistanceBar({ distance, max }: { distance: number; max: number }) {
  const pct = Math.min(100, (distance / max) * 100);

  return (
    <div style={{ width: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{ fontSize: 10, color: '#C0C8D8', letterSpacing: 1 }}>DISTANCE</div>
      <div
        style={{
          width: '100%',
          height: 8,
          background: 'rgba(192,200,216,0.1)',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #008866, #00ffaa)',
            borderRadius: 4,
            transition: 'width 0.3s',
            boxShadow: '0 0 8px #00ffaa',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${pct - 2}%`,
            width: 4,
            height: '100%',
            background: '#ffffff',
            borderRadius: 2,
            boxShadow: '0 0 6px #00ffaa',
          }}
        />
      </div>
      <div style={{ fontSize: 9, color: '#00ffaa' }}>{Math.round(pct)}%</div>
    </div>
  );
}

function EnergyDisplay({ value, max }: { value: number; max: number }) {
  const low = value / max < 0.3;
  const flash = low && Math.sin(Date.now() / 150) > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
      <div style={{ fontSize: 9, color: '#C0C8D8', letterSpacing: 1 }}>ENERGY</div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 'bold',
          color: low ? (flash ? '#ff4444' : '#4488ff') : '#4488ff',
          textShadow: `0 0 10px ${low ? '#ff4444' : '#4488ff'}`,
          transition: 'color 0.2s',
        }}
      >
        {Math.round(value)}
      </div>
      <div
        style={{
          width: 80,
          height: 4,
          background: 'rgba(68,136,255,0.15)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${(value / max) * 100}%`,
            height: '100%',
            background: low
              ? 'linear-gradient(90deg, #ff4444, #ff8844)'
              : 'linear-gradient(90deg, #2266cc, #4488ff)',
            borderRadius: 2,
            transition: 'width 0.3s',
          }}
        />
      </div>
    </div>
  );
}

function CargoBar({ cargo }: { cargo: { type: CargoType; integrity: number }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 9, color: '#C0C8D8', letterSpacing: 1, marginBottom: 2 }}>CARGO</div>
      {cargo.map((item, i) => {
        const damaged = item.integrity < 30;
        const flashRed = damaged && Math.sin(Date.now() / 200 + i) > 0;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, width: 16, textAlign: 'center' }}>{cargoIcons[item.type]}</span>
            <div
              style={{
                width: 90,
                height: 6,
                background: 'rgba(192,200,216,0.1)',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${item.integrity}%`,
                  height: '100%',
                  background: damaged
                    ? flashRed
                      ? '#ff3333'
                      : cargoColors[item.type]
                    : cargoColors[item.type],
                  borderRadius: 3,
                  transition: 'width 0.3s, background 0.2s',
                }}
              />
            </div>
            <span
              style={{
                fontSize: 10,
                color: damaged ? '#ff4444' : '#C0C8D8',
                minWidth: 30,
                transition: 'color 0.2s',
              }}
            >
              {Math.round(item.integrity)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LivesDisplay({ lives, maxLives }: { lives: number; maxLives: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ fontSize: 9, color: '#C0C8D8', letterSpacing: 1, marginRight: 4 }}>LIVES</div>
      {Array.from({ length: maxLives }).map((_, i) => {
        const alive = i < lives;
        const justLost = i === lives && Date.now() % 1000 < 500;
        const scale = justLost ? 1.3 : 1;
        return (
          <div
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: alive ? '#4488cc' : '#661122',
              boxShadow: alive ? '0 0 8px #4488cc' : '0 0 4px #661122',
              transform: `scale(${scale})`,
              transition: 'background 0.3s, transform 0.3s, box-shadow 0.3s',
            }}
          />
        );
      })}
    </div>
  );
}

function EscapeRing({ progress }: { progress: number }) {
  if (progress <= 0) return null;
  const r = 40;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - progress);

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}
    >
      <svg width={100} height={100}>
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(120,40,200,0.2)" strokeWidth={4} />
        <circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke="#8833dd"
          strokeWidth={4}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.1s', filter: 'drop-shadow(0 0 8px #8833dd)' }}
        />
        <text x={50} y={55} textAnchor="middle" fill="#aa55ff" fontSize={14} fontWeight="bold">
          {Math.round(progress * 100)}%
        </text>
      </svg>
    </div>
  );
}

const HUD: React.FC = () => {
  const { shield, energy, maxEnergy, distance, maxDistance, cargo, lives, maxLives, escapeProgress, shieldCooldown, shieldActive } =
    useGameStore();

  const glassStyle: React.CSSProperties = {
    background: 'rgba(11,13,23,0.65)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderTop: '1px solid rgba(192,200,216,0.08)',
    borderBottom: '1px solid rgba(192,200,216,0.08)',
  };

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', fontFamily: "'Segoe UI', sans-serif" }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 70,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 24px',
          ...glassStyle,
        }}
      >
        <ShieldRing value={shield} />
        <DistanceBar distance={distance} max={maxDistance} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <EnergyDisplay value={energy} max={maxEnergy} />
          {shieldCooldown > 0 && (
            <div style={{ fontSize: 9, color: '#ff8844' }}>
              Shield CD: {shieldCooldown.toFixed(1)}s
            </div>
          )}
          {shieldActive && (
            <div style={{ fontSize: 9, color: '#00ffaa' }}>
              SHIELD ACTIVE
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 24px',
          ...glassStyle,
        }}
      >
        <CargoBar cargo={cargo} />
        <LivesDisplay lives={lives} maxLives={maxLives} />
      </div>

      <EscapeRing progress={escapeProgress.progress} />
    </div>
  );
};

export default HUD;
