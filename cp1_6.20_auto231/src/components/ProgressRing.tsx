import React from "react";

interface ProgressRingProps {
  active: boolean;
  progress?: number;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({ active, progress }) => {
  const size = 140;
  const rings = active ? [0, 1, 2] : [];

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {rings.map((i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-full animate-pulse-ring"
          style={{
            border: `2px solid transparent`,
            background: `linear-gradient(#152238, #152238) padding-box, linear-gradient(${i * 60}deg, #00bcd4, #3f51b5, #64ffda) border-box`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
      {active && progress !== undefined && (
        <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 6}
            fill="none"
            stroke="rgba(0,188,212,0.15)"
            strokeWidth="4"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 6}
            fill="none"
            stroke="url(#grad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * (size / 2 - 6)}
            strokeDashoffset={2 * Math.PI * (size / 2 - 6) * (1 - progress)}
            style={{ transition: "stroke-dashoffset 0.2s ease" }}
          />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00bcd4" />
              <stop offset="100%" stopColor="#3f51b5" />
            </linearGradient>
          </defs>
        </svg>
      )}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {active && progress !== undefined ? (
          <>
            <span className="font-mono text-2xl font-semibold text-accent-cyan">
              {Math.round(progress * 100)}%
            </span>
            <span className="mt-1 text-xs text-slate-400">解析中</span>
          </>
        ) : (
          <span className="text-xs text-slate-500">等待文件</span>
        )}
      </div>
    </div>
  );
};
