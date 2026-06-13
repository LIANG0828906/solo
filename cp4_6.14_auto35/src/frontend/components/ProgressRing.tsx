import React, { useEffect, useState } from 'react';
import { getProgressColor } from '../utils/helpers';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

const ProgressRing: React.FC<ProgressRingProps> = ({ 
  progress, 
  size = 120, 
  strokeWidth = 10,
  showLabel = true 
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (displayProgress / 100) * circumference;
  const color = getProgressColor(displayProgress);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="progress-ring-circle"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>
            {displayProgress}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressRing;
