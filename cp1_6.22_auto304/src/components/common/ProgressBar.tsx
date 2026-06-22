import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  color: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = React.memo(({ value, max, color }) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div
      style={{
        width: '100%',
        height: '8px',
        backgroundColor: '#2A2A2A',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: '4px',
          transition: 'width 0.3s ease, background-color 0.3s ease',
        }}
      />
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';
