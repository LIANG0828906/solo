import React, { useEffect, useState } from 'react';

interface ProgressRingProps {
  percentage: number;
  completedCount?: number;
  totalCount?: number;
  size?: number;
  strokeWidth?: number;
  remainingColor?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  completedCount,
  totalCount,
  size = 140,
  strokeWidth = 12,
  remainingColor = '#E2E8F0',
}) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(percentage);

  useEffect(() => {
    let rafId: number;
    const startValue = animatedPercentage;
    const endValue = percentage;
    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (endValue - startValue) * easeProgress);
      
      setAnimatedPercentage(currentValue);

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percentage]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedPercentage / 100) * circumference;
  const gradientId = `greenGradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="progress-ring-container">
      <div className="progress-ring-wrapper">
        <div className="progress-ring" style={{ width: size, height: size }}>
          <svg width={size} height={size}>
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#6EE7B7" />
              </linearGradient>
            </defs>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={remainingColor}
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="progress-ring-circle"
            />
          </svg>
          <div className="progress-ring-text">
            <div className="progress-ring-percentage">{animatedPercentage}%</div>
            <div className="progress-ring-subtitle">完成进度</div>
          </div>
        </div>
        {completedCount !== undefined && totalCount !== undefined && (
          <div className="progress-ring-info">
            <span className="progress-info-dot" style={{ backgroundColor: '#10B981' }} />
            <span className="progress-info-text">
              已完成 <strong>{completedCount}</strong> / {totalCount} 个任务
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ProgressRing);
