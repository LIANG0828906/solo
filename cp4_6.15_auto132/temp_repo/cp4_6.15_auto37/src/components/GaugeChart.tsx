interface GaugeChartProps {
  value: number;
  max: number;
  label: string;
  prefix?: string;
}

export function GaugeChart({ value, max, label, prefix = '¥' }: GaugeChartProps) {
  const safeMax = Math.max(0, max);
  const safeValue = Math.max(0, Math.min(value, safeMax));
  const ratio = safeMax > 0 ? safeValue / safeMax : 0;
  const percent = Math.round(ratio * 100);
  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const dashOffset = arcLength - arcLength * ratio;

  return (
    <div className="flex flex-col items-center">
      <svg width="220" height="200" viewBox="0 0 220 200">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="rgba(245, 158, 11, 0.15)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          transform="rotate(135 110 110)"
        />
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={dashOffset}
          transform="rotate(135 110 110)"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
        <text
          x="110"
          y="88"
          textAnchor="middle"
          className="fill-amber-500 font-display"
          style={{ fontSize: '16px', fontWeight: 600 }}
        >
          {percent}%
        </text>
        <text
          x="110"
          y="114"
          textAnchor="middle"
          className="fill-amber-900 font-display"
          style={{ fontSize: '24px', fontWeight: 700 }}
        >
          {prefix}
          {Math.max(0, value).toLocaleString()}
        </text>
        <text
          x="110"
          y="136"
          textAnchor="middle"
          className="fill-amber-700"
          style={{ fontSize: '13px' }}
        >
          {label}
        </text>
        <text
          x="110"
          y="160"
          textAnchor="middle"
          className="fill-amber-600"
          style={{ fontSize: '11px' }}
        >
          目标 {prefix}
          {safeMax.toLocaleString()}
        </text>
      </svg>
    </div>
  );
}
