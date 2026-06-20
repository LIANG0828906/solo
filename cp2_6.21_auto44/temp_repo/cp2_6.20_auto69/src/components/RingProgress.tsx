import React, { useEffect, useState } from 'react';

interface RingProgressProps {
  positivePercent: number;
  improvementPercent: number;
  size?: number;
  strokeWidth?: number;
}

export const RingProgress: React.FC<RingProgressProps> = ({
  positivePercent,
  improvementPercent,
  size = 160,
  strokeWidth = 14,
}) => {
  const [animatedPositive, setAnimatedPositive] = useState(0);
  const [animatedImprovement, setAnimatedImprovement] = useState(0);
  const [displayPositive, setDisplayPositive] = useState(0);
  const [displayImprovement, setDisplayImprovement] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const duration = 1000;
    const startTime = performance.now();
    const startPositive = 0;
    const startImprovement = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const newPositive = startPositive + (positivePercent - startPositive) * easeOut;
      const newImprovement =
        startImprovement + (improvementPercent - startImprovement) * easeOut;

      setAnimatedPositive(newPositive);
      setAnimatedImprovement(newImprovement);
      setDisplayPositive(Math.round(newPositive));
      setDisplayImprovement(Math.round(newImprovement));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [positivePercent, improvementPercent]);

  const positiveOffset = circumference - (animatedPositive / 100) * circumference;
  const improvementOffset =
    circumference - (animatedImprovement / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="ring-progress"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#4caf50"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={positiveOffset}
            strokeLinecap="round"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius - strokeWidth - 4}
            fill="none"
            stroke="#ff9800"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference * 0.82}
            strokeDashoffset={improvementOffset * 0.82}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-text-primary">
            {displayPositive + displayImprovement}
          </span>
          <span className="text-xs text-text-secondary">总评语</span>
        </div>
      </div>
      <div className="flex gap-6 mt-4 w-full justify-center">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-positive" />
          <span className="text-sm text-text-secondary">
            正面 <span className="font-semibold text-positive">{displayPositive}%</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-improvement" />
          <span className="text-sm text-text-secondary">
            待改进{' '}
            <span className="font-semibold text-improvement">
              {displayImprovement}%
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};
