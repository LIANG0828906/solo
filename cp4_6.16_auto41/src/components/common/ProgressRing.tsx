import { useEffect, useState } from 'react';
import { getProgressColor } from '@/utils/calculations';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  animate?: boolean;
  label?: string;
  showValue?: boolean;
  fontSize?: number;
}

const ProgressRing = ({
  progress,
  size = 120,
  strokeWidth = 10,
  animate = true,
  label,
  showValue = true,
  fontSize = 28,
}: ProgressRingProps) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const actualProgress = Math.max(0, Math.min(100, progress));
  const offset = circumference - (animatedProgress / 100) * circumference;
  const color = getProgressColor(actualProgress);

  useEffect(() => {
    if (!animate) {
      setAnimatedProgress(actualProgress);
      return;
    }

    let raf: number;
    const startTime = performance.now();
    const startValue = 0;
    const duration = 1500;

    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      const current = startValue + (actualProgress - startValue) * eased;
      setAnimatedProgress(current);

      if (t < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [actualProgress, animate]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
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
          style={{
            transition: 'stroke 0.4s ease',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        {showValue && (
          <span
            className="font-bold leading-none"
            style={{ fontSize }}
          >
            {animatedProgress.toFixed(0)}%
          </span>
        )}
        {label && (
          <span className="text-xs mt-1 opacity-90 font-medium">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProgressRing;
