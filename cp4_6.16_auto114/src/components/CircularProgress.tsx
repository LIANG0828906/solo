import React from 'react';

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 70,
  strokeWidth = 6
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const getColor = (val: number) => {
    if (val <= 30) return '#4ade80';
    if (val <= 60) return '#fbbf24';
    return '#ef4444';
  };

  const color = getColor(value);

  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className="circular-progress-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="circular-progress-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            background: `linear-gradient(90deg, ${getColor(0)}, ${getColor(100)})`,
            strokeDashoffset: offset
          }}
        />
      </svg>
      <span className="circular-progress-text" style={{ color }}>
        {value}%
      </span>
    </div>
  );
};

export default CircularProgress;
