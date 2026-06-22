import { VoteOption } from '@/types';

interface DonutChartProps {
  options: VoteOption[];
  totalVotes: number;
}

const COLORS = [
  ['#e94560', '#ff6b6b'],
  ['#4f46e5', '#818cf8'],
  ['#0ea5e9', '#38bdf8'],
  ['#10b981', '#34d399'],
  ['#f59e0b', '#fbbf24'],
  ['#8b5cf6', '#a78bfa'],
];

export function DonutChart({ options, totalVotes }: DonutChartProps) {
  const size = 36;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div style={containerStyle}>
      {options.map((option, index) => {
        const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
        const dashOffset = circumference * (1 - percentage / 100);
        const rotation = -90 + (cumulativePercent / 100) * 360;
        cumulativePercent += percentage;
        const [colorStart, colorEnd] = COLORS[index % COLORS.length];
        const gradientId = `donut-grad-${index}`;

        return (
          <div key={option.index} style={itemStyle}>
            <svg width="80" height="80" viewBox={`0 0 ${size} ${size}`}>
              <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={colorStart} />
                  <stop offset="100%" stopColor={colorEnd} />
                </linearGradient>
              </defs>

              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth={strokeWidth}
              />

              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference}
                style={{
                  animation: `drawCircle-${index} 1s ease-out forwards`,
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: 'center',
                }}
              />

              <style>{`
                @keyframes drawCircle-${index} {
                  to {
                    strokeDashoffset: ${dashOffset};
                  }
                }
              `}</style>

              <text
                x={size / 2}
                y={size / 2 + 2}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="9"
                fontWeight="700"
                style={{ animation: 'fadeIn 1.2s ease-out' }}
              >
                {percentage.toFixed(0)}%
              </text>
            </svg>

            <div style={labelContainerStyle}>
              <div style={labelHeaderStyle}>
                <span
                  style={{
                    ...dotStyle,
                    background: `linear-gradient(135deg, ${colorStart}, ${colorEnd})`,
                  }}
                />
                <span style={optionLabelStyle}>
                  {String.fromCharCode(65 + index)}. {option.text.length > 8 ? option.text.slice(0, 8) + '...' : option.text}
                </span>
              </div>
              <div style={voteInfoStyle}>
                <span style={voteCountStyle}>{option.votes}票</span>
                <span style={percentageStyle}>{percentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '20px',
  justifyContent: 'center',
  padding: '16px 0',
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  background: 'rgba(255, 255, 255, 0.03)',
  padding: '12px 16px',
  borderRadius: '10px',
  animation: 'fadeIn 0.5s ease-out',
};

const labelContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const labelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const dotStyle: React.CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  flexShrink: 0,
};

const optionLabelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-primary)',
};

const voteInfoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  paddingLeft: '14px',
};

const voteCountStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-secondary)',
  fontWeight: 500,
};

const percentageStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: 'var(--accent)',
};
