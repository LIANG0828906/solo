import React, { memo } from 'react';
import type { Rune } from '@/types';

interface RuneCardProps {
  rune: Rune;
  disabled?: boolean;
}

export const RuneCard: React.FC<RuneCardProps> = memo(function RuneCard({ rune, disabled }) {
  const isDepleted = rune.count <= 0 || disabled;

  const handleDragStart = (e: React.DragEvent) => {
    if (isDepleted) return;
    e.dataTransfer.setData('rune-type', rune.type);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={`hex rune-card ${isDepleted ? 'depleted' : ''}`}
      draggable={!isDepleted}
      onDragStart={handleDragStart}
      style={{
        background: `linear-gradient(135deg, ${rune.color}cc, ${rune.color}55)`,
        boxShadow: `0 4px 16px ${rune.color}55`,
      }}
      title={rune.name}
    >
      <div
        className="hex-inner"
        style={{
          background: `linear-gradient(135deg, ${rune.color}, ${rune.color}aa 60%, #00000066)`,
        }}
      >
        <span className="rune-icon">{rune.icon}</span>
      </div>
      <div className="rune-count">×{rune.count}</div>
      <div className="rune-tooltip">{rune.name}</div>
    </div>
  );
});
