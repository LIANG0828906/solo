import React from 'react';
import './EnergyBar.css';

interface EnergyBarProps {
  current: number;
  max: number;
  label?: string;
}

export const EnergyBar: React.FC<EnergyBarProps> = ({
  current,
  max,
  label = '能量',
}) => {
  const gems = Math.min(max, 10);
  const filledGems = Math.min(current, gems);

  return (
    <div className="energy-bar">
      <span className="energy-label">{label}</span>
      <div className="energy-gems">
        {Array.from({ length: gems }).map((_, i) => (
          <div
            key={i}
            className={`energy-gem ${i < filledGems ? 'filled' : 'empty'}`}
          >
            <div className="gem-inner" />
          </div>
        ))}
      </div>
      <span className="energy-value">{current}/{max}</span>
    </div>
  );
};
