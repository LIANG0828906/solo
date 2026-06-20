import React, { useState, memo } from 'react';
import type { RuneType } from '@/types';
import { RUNE_CONFIG } from '@/gameLogic';

interface RuneSlotProps {
  index: number;
  runeType: RuneType | null;
  isFail: boolean;
  onDrop: (slotIndex: number, runeType: RuneType) => void;
  onClick: (slotIndex: number) => void;
  disabled?: boolean;
}

export const RuneSlot: React.FC<RuneSlotProps> = memo(function RuneSlot({
  index,
  runeType,
  isFail,
  onDrop,
  onClick,
  disabled,
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !runeType) setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || runeType) return;
    const type = e.dataTransfer.getData('rune-type') as RuneType;
    if (type) onDrop(index, type);
  };

  const color = runeType ? RUNE_CONFIG[runeType].color : undefined;

  return (
    <div
      className={`hex hex-sm rune-slot ${dragOver ? 'drag-over' : ''} ${isFail ? 'fail' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && runeType && onClick(index)}
      style={
        color
          ? ({
              background: `linear-gradient(135deg, ${color}40, ${color}15)`,
              borderColor: color,
              borderStyle: 'solid',
            } as React.CSSProperties)
          : undefined
      }
    >
      <div className="hex-inner" style={color ? { background: `linear-gradient(135deg, ${color}30, #00000050)` } : undefined}>
        {runeType ? (
          <span className="slot-rune" style={{ color }}>
            {RUNE_CONFIG[runeType].icon}
          </span>
        ) : (
          <span className="slot-hint">拖入</span>
        )}
      </div>
    </div>
  );
});
