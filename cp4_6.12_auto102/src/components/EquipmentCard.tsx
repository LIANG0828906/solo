import React, { useState } from 'react';
import {
  Equipment,
  Rarity,
  RARITY_COLORS,
  RARITY_LABELS,
  STAT_KEYS,
  STAT_LABELS,
  EQUIPMENT_TYPE_LABELS,
} from '../types';

interface Props {
  equipment: Equipment;
  size?: 'normal' | 'small';
  showDetails?: boolean;
  compareStats?: Record<string, number> | null;
  onClick?: () => void;
}

const EquipmentCard: React.FC<Props> = ({ equipment, size = 'normal', showDetails = true, compareStats, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const rarityColor = RARITY_COLORS[equipment.rarity];

  if (size === 'small') {
    return (
      <div
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 180,
          height: 100,
          background: 'rgba(28, 35, 49, 0.8)',
          backdropFilter: 'blur(6px)',
          border: `1px solid ${hovered ? rarityColor : '#30363d'}`,
          borderRadius: 8,
          padding: 8,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'border-color 0.25s, transform 0.25s',
          transform: hovered ? 'translateY(-2px)' : 'none',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: rarityColor }} />
        <div style={{ paddingLeft: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: rarityColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {equipment.itemName}
          </div>
          <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>
            {EQUIPMENT_TYPE_LABELS[equipment.type]} · {RARITY_LABELS[equipment.rarity]}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {STAT_KEYS.slice(0, 2).map(k => (
              <span key={k} style={{ fontSize: 10, color: '#8b949e' }}>
                {STAT_LABELS[k]}:{equipment.stats[k]}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 260,
        minHeight: 320,
        background: 'rgba(28, 35, 49, 0.85)',
        backdropFilter: 'blur(6px)',
        border: `1px solid ${hovered ? rarityColor : '#30363d'}`,
        borderRadius: 12,
        padding: 20,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.25s, transform 0.25s, box-shadow 0.25s',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? `0 0 20px ${rarityColor}40` : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -60,
          left: -60,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${rarityColor}50 0%, transparent 70%)`,
          opacity: 0.6,
          animation: 'glowRotate 4s linear infinite',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: rarityColor, marginBottom: 4 }}>
          {equipment.itemName}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: rarityColor, border: `1px solid ${rarityColor}60`, borderRadius: 4, padding: '1px 6px' }}>
            {RARITY_LABELS[equipment.rarity]}
          </span>
          <span style={{ fontSize: 12, color: '#8b949e' }}>
            {EQUIPMENT_TYPE_LABELS[equipment.type]}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {STAT_KEYS.map(k => {
            const val = equipment.stats[k];
            const diff = compareStats ? val - (compareStats[k] || 0) : 0;
            return (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#8b949e' }}>{STAT_LABELS[k]}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 14, color: '#e6edf3' }}>{val}</span>
                  {compareStats && diff !== 0 && (
                    <span style={{ fontSize: 12, color: diff > 0 ? '#3fb950' : '#f85149' }}>
                      {diff > 0 ? '+' : ''}{diff}
                    </span>
                  )}
                </div>
                <div style={{ width: 60, height: 4, background: '#30363d', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${(val / 120) * 100}%`, height: '100%', background: rarityColor, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 12, fontStyle: 'italic', color: '#8b949e', lineHeight: 1.4 }}>
          {equipment.flavorText}
        </div>
      </div>
    </div>
  );
};

export default EquipmentCard;
