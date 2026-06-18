import { VoteOption } from '@/types';

interface BarChartProps {
  options: VoteOption[];
  totalVotes: number;
  winnerIndex: number | null;
  showWinner?: boolean;
}

export function BarChart({ options, totalVotes, winnerIndex, showWinner = false }: BarChartProps) {
  const maxVotes = Math.max(...options.map((o) => o.votes), 1);

  return (
    <div style={containerStyle}>
      <svg
        width="100%"
        height={80 + options.length * 60}
        viewBox={`0 0 600 ${80 + options.length * 60}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e94560" />
            <stop offset="100%" stopColor="#ff6b6b" />
          </linearGradient>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffd700" />
            <stop offset="50%" stopColor="#ffec8b" />
            <stop offset="100%" stopColor="#ffd700" />
          </linearGradient>
        </defs>
        {options.map((option, index) => {
          const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
          const barWidth = totalVotes > 0 ? (option.votes / maxVotes) * 420 : 0;
          const y = 50 + index * 60;
          const isWinner = showWinner && winnerIndex === index;

          return (
            <g key={option.index}>
              <text x="20" y={y + 4} style={optionLabelStyle} fill="var(--text-secondary)">
                {String.fromCharCode(65 + index)}. {option.text.length > 15 ? option.text.slice(0, 15) + '...' : option.text}
              </text>

              <rect
                x="150"
                y={y - 16}
                width="420"
                height="28"
                rx="6"
                fill="rgba(255, 255, 255, 0.05)"
              />

              <rect
                x="150"
                y={y - 16}
                width={barWidth}
                height="28"
                rx="6"
                fill={isWinner ? 'url(#goldGradient)' : 'url(#barGradient)'}
                style={{
                  transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1), fill 0.3s ease',
                }}
              />

              <text
                x="150"
                y={y + 4}
                style={voteCountStyle}
                fill="#ffffff"
              >
                {barWidth > 80 ? `${option.votes}票 (${percentage.toFixed(1)}%)` : ''}
              </text>

              {barWidth <= 80 && (
                <text
                  x={150 + barWidth + 8}
                  y={y + 4}
                  style={voteCountStyle}
                  fill="var(--text-secondary)"
                >
                  {option.votes}票 ({percentage.toFixed(1)}%)
                </text>
              )}

              {isWinner && (
                <text
                  x={150 + barWidth - 20}
                  y={y + 2}
                  fontSize="16"
                  style={{ transition: 'all 0.5s ease' }}
                >
                  👑
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  width: '100%',
  overflow: 'hidden',
  padding: '8px 0',
};

const optionLabelStyle = {
  fontSize: '13px',
  fontWeight: 500,
  transition: 'all 0.3s ease',
};

const voteCountStyle = {
  fontSize: '12px',
  fontWeight: 600,
  paddingLeft: '12px',
  transition: 'all 0.3s ease',
};
