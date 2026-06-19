import React, { useEffect } from 'react';
import { sfx } from '../utils/audio';
import { levelBadgeColor } from '../utils/helpers';

interface Props {
  open: boolean;
  level: number;
  onClose: () => void;
}

export const LevelUpEffect: React.FC<Props> = ({ open, level, onClose }) => {
  useEffect(() => {
    if (open) {
      sfx.levelup();
      const t = setTimeout(onClose, 2600);
      return () => clearTimeout(t);
    }
  }, [open]);
  if (!open) return null;
  const col = levelBadgeColor(level);
  const stars = Array.from({ length: Math.min(level, 5) });
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(circle at center, rgba(255,215,0,0.25), rgba(0,0,0,0.55))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, pointerEvents: 'none',
    }}>
      <div style={{ position: 'relative', width: 340, height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="340" height="340" viewBox="0 0 340 340" style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * 360;
            return (
              <rect key={i}
                x="168" y="10" width="6" height="110" rx="3"
                fill={`url(#ray-${i})`}
                transform={`rotate(${angle} 170 170)`}
                style={{
                  transformOrigin: '170px 170px',
                  animation: `levelup-rays 2s ease-out ${i * 0.03}s`,
                  opacity: 0,
                }}
              />
            );
          })}
          <defs>
            {Array.from({ length: 12 }).map((_, i) => (
              <linearGradient key={`ray-${i}`} id={`ray-${i}`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#FFF176" stopOpacity="0.0" />
                <stop offset="40%" stopColor="#FFEB3B" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#FFA726" stopOpacity="0.6" />
              </linearGradient>
            ))}
          </defs>
        </svg>

        {stars.map((_, i) => {
          const angle = (i / stars.length) * Math.PI * 2 - Math.PI / 2;
          const r = 130;
          const x = 170 + Math.cos(angle) * r;
          const y = 170 + Math.sin(angle) * r;
          return (
            <div key={i} style={{
              position: 'absolute', left: x, top: y,
              transform: 'translate(-50%,-50%)',
              animation: `sparkle 1.4s ease-in-out ${0.2 + i * 0.12}s infinite`,
              fontSize: 26,
            }}>✨</div>
          );
        })}

        <div style={{
          width: 180, height: 180, borderRadius: '50%',
          background: `radial-gradient(circle, ${col.shine}, ${col.fill} 65%, ${col.stroke})`,
          boxShadow: `0 0 60px ${col.fill}, inset 0 0 30px ${col.shine}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'levelup-badge 1s cubic-bezier(0.34,1.56,0.64,1) forwards',
          border: `6px solid ${col.stroke}`,
        }}>
          <svg width="140" height="140" viewBox="0 0 38 36">
            <path
              d="M19 2 L23 13 L35 13 L25 21 L29 33 L19 26 L9 33 L13 21 L3 13 L15 13 Z"
              fill={col.shine}
              stroke={col.stroke}
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
            <text x="19" y="23" textAnchor="middle" fontFamily="var(--font-cartoon)" fontSize="12" fill="#5D4037" fontWeight="900">
              Lv.{level}
            </text>
          </svg>
        </div>

        <div style={{
          position: 'absolute', bottom: -10,
          fontFamily: 'var(--font-cartoon)', fontSize: 32,
          color: '#FFEB3B',
          textShadow: '0 0 12px #FF6F00, 0 3px 6px rgba(0,0,0,0.4)',
          animation: 'levelup-badge 1s cubic-bezier(0.34,1.56,0.64,1) 0.3s both',
          whiteSpace: 'nowrap',
        }}
        >🎉 升级成功! 🎉</div>
      </div>
    </div>
  );
};

export default LevelUpEffect;
