import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

interface TimerBarProps {
  timeLeft: number;
  totalTime: number;
}

const OUTER_RADIUS = 20;
const INNER_RADIUS = 16;
const STROKE_WIDTH = OUTER_RADIUS - INNER_RADIUS;
const RADIUS = (OUTER_RADIUS + INNER_RADIUS) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const COLOR_START = '#4CAF90';
const COLOR_END = '#F44336';

const TimerBar: React.FC<TimerBarProps> = ({ timeLeft, totalTime }) => {
  const tick = useGameStore((s) => s.tick);
  const phase = useGameStore((s) => s.phase);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== 'playing') {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = window.setInterval(() => {
      tick();
    }, 1000);
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase, tick]);

  const ratio = Math.max(0, Math.min(1, timeLeft / totalTime));
  const dashOffset = CIRCUMFERENCE * (1 - ratio);

  const r = ratio;
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  const parseColor = (c: string) => {
    const h = c.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  };
  const start = parseColor(COLOR_START);
  const end = parseColor(COLOR_END);
  const currentColor = `#${hex(Math.round(start.r + (end.r - start.r) * (1 - r)))}${hex(
    Math.round(start.g + (end.g - start.g) * (1 - r))
  )}${hex(Math.round(start.b + (end.b - start.b) * (1 - r)))}`;

  const size = 40;

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <defs>
          <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={COLOR_START} />
            <stop offset="100%" stopColor={COLOR_END} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={RADIUS}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth={STROKE_WIDTH}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={RADIUS}
          fill="none"
          stroke={currentColor}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease',
            filter: `drop-shadow(0 0 4px ${currentColor})`,
          }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'Menlo, Consolas, monospace',
        }}
      >
        {timeLeft}
      </div>
    </div>
  );
};

export default React.memo(TimerBar);
