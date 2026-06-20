import React from 'react';

interface ScoreSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color?: string;
}

export const ScoreSlider: React.FC<ScoreSliderProps> = ({
  label,
  value,
  onChange,
  color = 'var(--color-brand)',
}) => {
  const progress = ((value - 1) / 9) * 100;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <span
          className="text-lg font-bold"
          style={{ color }}
        >
          {value}
        </span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider-track w-full cursor-pointer"
        style={
          {
            '--slider-progress': `${progress}%`,
          } as React.CSSProperties
        }
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs text-text-secondary">1</span>
        <span className="text-xs text-text-secondary">10</span>
      </div>
    </div>
  );
};
