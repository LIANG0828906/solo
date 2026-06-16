import React from 'react';

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  showText?: boolean;
  textColor?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 28,
  strokeWidth = 3,
  color = '#1976D2',
  trackColor = 'rgba(255, 255, 255, 0.3)',
  showText = true,
  textColor = '#FFFFFF',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const offset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.3s ease-out',
          }}
        />
      </svg>
      {showText && (
        <span
          className="absolute inset-0 flex items-center justify-center font-bold"
          style={{
            color: textColor,
            fontSize: size * 0.28,
            lineHeight: 1,
          }}
        >
          {Math.round(clampedProgress)}
        </span>
      )}
    </div>
  );
};

export default CircularProgress;
