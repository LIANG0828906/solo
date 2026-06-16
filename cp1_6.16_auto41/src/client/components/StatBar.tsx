import { memo } from 'react';
import type { PetStats } from '../types';
import { STAT_NAMES } from '../pet';
import './StatBar.css';

interface StatBarProps {
  stat: keyof PetStats;
  value: number;
}

const StatBar = memo(function StatBar({ stat, value }: StatBarProps) {
  const isLow = value < 30;
  const isCritical = value < 20;

  return (
    <div className="stat-bar-container">
      <div className="stat-bar-label">
        <span>{STAT_NAMES[stat]}</span>
        <span className="stat-bar-value">{Math.round(value)}</span>
      </div>
      <div className={`stat-bar-track ${isCritical ? 'flash' : ''}`}>
        <div
          className="stat-bar-fill"
          style={{
            width: `${value}%`,
            background: isLow
              ? 'linear-gradient(90deg, #ff6b6b, #ff8787)'
              : 'linear-gradient(90deg, #98D8AA, #6BCB77)',
          }}
        />
      </div>
    </div>
  );
});

export default StatBar;
