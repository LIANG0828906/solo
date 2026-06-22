import React, { memo } from 'react';

interface HealthBarProps {
  name: string;
  current: number;
  max: number;
  align?: 'left' | 'center' | 'right';
}

export const HealthBar: React.FC<HealthBarProps> = memo(function HealthBar({
  name,
  current,
  max,
  align = 'center',
}) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const isLow = pct < 30;

  return (
    <div className="health-bar-wrapper" style={{ alignItems: align }}>
      <div className="health-bar-name">{name}</div>
      <div className="health-bar">
        <div
          className={`health-bar-fill ${isLow ? 'low' : ''}`}
          style={{ width: `${pct}%` }}
        />
        <div className="health-bar-text">
          {current} / {max}
        </div>
      </div>
    </div>
  );
});
