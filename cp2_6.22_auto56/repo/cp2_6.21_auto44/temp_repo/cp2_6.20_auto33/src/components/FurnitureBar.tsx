import React from 'react';
import type { FurnitureType } from '../types';
import { sfx } from '../utils/audio';

interface Props {
  onSelect: (type: FurnitureType) => void;
  disabled?: boolean;
}

const items: { type: FurnitureType; icon: string; label: string; color: string }[] = [
  { type: 'bowl',  icon: '🍚', label: '喂食', color: '#FFB74D' },
  { type: 'toy',   icon: '⚽', label: '玩耍', color: '#64B5F6' },
  { type: 'water', icon: '💧', label: '喝水', color: '#4FC3F7' },
  { type: 'bed',   icon: '🛏️', label: '休息', color: '#BA68C8' },
];

export const FurnitureBar: React.FC<Props> = ({ onSelect, disabled }) => {
  return (
    <div className="furniture-bar" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 12,
      padding: '14px',
      background: 'rgba(255,255,255,0.9)',
      borderRadius: 22,
      boxShadow: 'var(--shadow-soft)',
      border: '2px solid rgba(255,255,255,0.8)',
    }}>
      {items.map(it => (
        <button
          key={it.type}
          disabled={disabled}
          onClick={() => { sfx.click(); onSelect(it.type); }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: '14px 8px',
            borderRadius: 16,
            background: `linear-gradient(135deg, ${it.color}33 0%, ${it.color}66 100%)`,
            border: '2px solid rgba(255,255,255,0.8)',
            transition: 'var(--transition-mid)',
            minHeight: 72,
          }}
          onMouseEnter={(e) => {
            if (disabled) return;
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '';
          }}
        >
          <span style={{ fontSize: 30, lineHeight: 1 }}>{it.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#5D4037' }}>{it.label}</span>
        </button>
      ))}
    </div>
  );
};

export default FurnitureBar;
