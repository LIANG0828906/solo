import React from 'react';

interface StatusBarProps {
  label: string;
  value: number;
  max?: number;
}

const StatusBar: React.FC<StatusBarProps> = ({ label, value, max = 100 }) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  const hue = (percentage / 100) * 120;

  return (
    <div className="status-bar-container">
      <div className="status-bar-label">{label}</div>
      <div className="status-bar-track">
        <div
          className="status-bar-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: `hsl(${hue}, 70%, 50%)`,
          }}
        />
      </div>
      <div className="status-bar-value">{Math.round(value)}</div>
    </div>
  );
};

export default StatusBar;
