import './CountdownTimer.css';

interface CountdownTimerProps {
  timeLeft: number;
  totalTime: number;
}

export default function CountdownTimer({ timeLeft, totalTime }: CountdownTimerProps) {
  const percentage = Math.max(0, Math.min(1, timeLeft / totalTime));
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage);
  const isUrgent = timeLeft <= 5;
  const isCritical = timeLeft <= 2;

  const progress = 1 - percentage;
  const r = Math.round(34 + progress * 200);
  const g = Math.round(139 - progress * 89);
  const b = Math.round(34 - progress * 34);

  const displaySeconds = Math.ceil(timeLeft);

  return (
    <div
      className={`countdown-timer ${isUrgent ? 'urgent' : ''} ${
        isCritical ? 'critical' : ''
      }`}
    >
      <svg viewBox="0 0 180 180" width="180" height="180">
        <defs>
          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#228B22" />
            <stop offset="50%" stopColor="#DAA520" />
            <stop offset="100%" stopColor="#C8102E" />
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
          cx="90"
          cy="90"
          r={radius}
          fill="rgba(255,255,255,0.5)"
          stroke="#e0d8cc"
          strokeWidth="8"
        />

        {isUrgent && (
          <circle
            cx="90"
            cy="90"
            r={radius + 4}
            fill="none"
            stroke="rgba(200, 16, 46, 0.4)"
            strokeWidth="3"
            className="pulse-ring pulse-ring-1"
          />
        )}

        {isCritical && (
          <circle
            cx="90"
            cy="90"
            r={radius + 8}
            fill="none"
            stroke="rgba(200, 16, 46, 0.2)"
            strokeWidth="2"
            className="pulse-ring pulse-ring-2"
          />
        )}

        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={`rgb(${r},${g},${b})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 90 90)"
          filter={isUrgent ? 'url(#glow)' : undefined}
          className="progress-ring"
        />

        <text
          x="90"
          y="85"
          textAnchor="middle"
          className="countdown-text"
          fontSize="36"
          fill="#1a1a1a"
        >
          {displaySeconds}
        </text>
        <text
          x="90"
          y="112"
          textAnchor="middle"
          fontSize="13"
          fill="#888"
        >
          秒
        </text>
      </svg>
    </div>
  );
}
