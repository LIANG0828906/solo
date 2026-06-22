import React from 'react';
import { formatTime } from '../utils/calculations';

interface ProgressGaugeProps {
  progress: number;
  remainingTime: number;
  isIncubating: boolean;
}

const ProgressGauge: React.FC<ProgressGaugeProps> = ({
  progress,
  remainingTime,
  isIncubating,
}) => {
  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const progressColor = `hsl(${200 + progress * 1.6}, 80%, 60%)`;

  return (
    <div className="relative w-48 h-48">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#2d2d44"
          strokeWidth={strokeWidth}
        />

        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter="url(#glow)"
          className="transition-all duration-300 ease-out"
          style={{
            transition: 'stroke-dashoffset 0.3s ease-out',
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="text-3xl font-bold tracking-wider"
          style={{
            color: progressColor,
            fontFamily: "'Cinzel Decorative', serif",
            textShadow: `0 0 10px ${progressColor}`,
          }}
        >
          {Math.round(progress)}%
        </div>
        <div
          className="text-sm mt-1"
          style={{
            fontFamily: "'Lato', sans-serif",
            color: isIncubating ? '#b0b0d0' : '#6b7280',
          }}
        >
          {isIncubating ? formatTime(remainingTime) : '待孵化'}
        </div>
        {isIncubating && (
          <div className="flex gap-1 mt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: progressColor,
                  animation: `pulse 1s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressGauge;
