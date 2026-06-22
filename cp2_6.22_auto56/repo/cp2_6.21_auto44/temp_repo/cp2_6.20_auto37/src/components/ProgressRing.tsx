import React, { useState, useEffect } from 'react';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  colorStart?: string;
  colorEnd?: string;
  label?: string;
  group?: 'A' | 'B';
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  colorStart,
  colorEnd,
  label,
  group,
}) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const [displayNumber, setDisplayNumber] = useState(0);

  const gradientId = `gradient-${label || Math.random().toString(36).substr(2, 9)}`;

  const defaultColors = group === 'B'
    ? { start: '#3b82f6', end: '#1d4ed8' }
    : { start: '#10b981', end: '#059669' };

  const startColor = colorStart || defaultColors.start;
  const endColor = colorEnd || defaultColors.end;

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedPercentage / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 100);

    return () => clearTimeout(timer);
  }, [percentage]);

  useEffect(() => {
    if (displayNumber === percentage) return;

    const duration = 1000;
    const startTime = performance.now();
    const startValue = displayNumber;
    const endValue = percentage;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (endValue - startValue) * easeProgress);
      
      setDisplayNumber(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [animatedPercentage]);

  return (
    <div style={styles.container}>
      <svg width={size} height={size} style={styles.svg}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={styles.progressCircle}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          style={styles.percentageText}
        >
          {displayNumber}%
        </text>
      </svg>
      {label && (
        <div style={styles.label}>
          {group && <span style={{ ...styles.groupBadge, backgroundColor: group === 'A' ? '#10b981' : '#3b82f6' }}>{group}组</span>}
          <span style={styles.labelText}>{label}</span>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  svg: {
    transform: 'translateZ(0)',
  },
  progressCircle: {
    transition: 'stroke-dashoffset 1s ease-out',
  },
  percentageText: {
    fontSize: '24px',
    fontWeight: 700,
    fill: '#fff',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  groupBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 600,
  },
  labelText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '14px',
  },
};

export default ProgressRing;
