import { useEffect, useState, useRef, useMemo } from 'react';
import { getProgressColor } from '@/utils/calculations';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  animate?: boolean;
  label?: string;
  showValue?: boolean;
  fontSize?: number;
  duration?: number;
}

const ProgressRing = ({
  progress,
  size = 120,
  strokeWidth = 10,
  animate = true,
  label,
  showValue = true,
  fontSize = 28,
  duration = 1500,
}: ProgressRingProps) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startValRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  const safeProgress = Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : 0;

  const radius = useMemo(() => (size - strokeWidth) / 2, [size, strokeWidth]);
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);

  const strokeDasharray = useMemo(() => {
    const offset = (displayProgress / 100) * circumference;
    return `${offset} ${circumference}`;
  }, [displayProgress, circumference]);

  const color = getProgressColor(safeProgress);

  useEffect(() => {
    if (!animate) {
      setDisplayProgress(safeProgress);
      return;
    }

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    startValRef.current = displayProgress;
    startTimeRef.current = null;

    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };

    const easing = (t: number): number => {
      return easeOutCubic(t);
    };

    const tick = (now: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = now;
      }
      const elapsed = now - startTimeRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = easing(t);
      const current = startValRef.current + (safeProgress - startValRef.current) * eased;

      setDisplayProgress(current);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [safeProgress, animate, duration, displayProgress]);

  if (safeProgress === 0 && !label) {
    return (
      <div
        className="inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-400"
        style={{ width: size, height: size }}
      >
        <span className="text-sm font-medium">0%</span>
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
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
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          style={{
            transition: 'stroke 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        {showValue && (
          <span
            className="font-bold leading-none tabular-nums"
            style={{ fontSize }}
          >
            {displayProgress.toFixed(0)}%
          </span>
        )}
        {label && (
          <span className="text-xs mt-1 opacity-90 font-medium whitespace-nowrap">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProgressRing;
