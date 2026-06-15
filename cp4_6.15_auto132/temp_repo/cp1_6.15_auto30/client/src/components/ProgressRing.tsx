import React, { useMemo } from 'react';
import { getProgressColor } from '../utils';

interface Props {
  progress: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  labelInside?: string;
}

const ProgressRing: React.FC<Props> = React.memo(
  ({ progress, size = 80, strokeWidth = 8, showLabel = true, labelInside }) => {
    const pct = Math.min(Math.max(progress, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;
    const color = useMemo(() => getProgressColor(pct), [pct]);
    const gradId = `grad-ring-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <svg width={size} height={size} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.6s ease',
          }}
        />
        {showLabel && (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#374151"
            fontWeight={700}
            fontSize={size * 0.22}
            fontFamily="'JetBrains Mono', monospace"
          >
            {labelInside || `${Math.round(pct)}%`}
          </text>
        )}
      </svg>
    );
  }
);

ProgressRing.displayName = 'ProgressRing';
export default ProgressRing;
