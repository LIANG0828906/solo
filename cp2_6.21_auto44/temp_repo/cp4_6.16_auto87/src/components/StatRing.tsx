interface StatRingProps {
  value: number;
  max: number;
  label: string;
  color?: string;
  suffix?: string;
  trendText?: string;
}

export default function StatRing({ value, max, label, color = '#06b6d4', suffix = '', trendText }: StatRingProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-20 h-20">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="6"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 40 40)"
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-bold text-lg text-slate-700">
            {value}{suffix}
          </span>
        </div>
      </div>
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      {trendText && (
        <span className="text-[10px] text-accent/70 font-medium text-center leading-tight max-w-[80px]">
          {trendText}
        </span>
      )}
    </div>
  );
}
