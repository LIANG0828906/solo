import { useEffect, useState } from 'react';
import type { VoteOption } from '../types';

interface PieChartProps {
  options: VoteOption[];
  totalVotes: number;
  userOptionId?: string;
}

const PIE_COLORS = [
  '#6C63FF',
  '#00D4AA',
  '#FF6B6B',
  '#FFB84D',
  '#4ECDC4',
  '#9B87F5',
];

export function PieChart({ options, totalVotes, userOptionId }: PieChartProps) {
  const [animated, setAnimated] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const percentages = options.map((o) =>
    totalVotes > 0 ? (o.voteCount / totalVotes) * 100 : 0,
  );

  let gradientParts: string[] = [];
  let acc = 0;
  percentages.forEach((pct, i) => {
    const start = acc;
    const end = acc + pct;
    gradientParts.push(`${PIE_COLORS[i % PIE_COLORS.length]} ${start}% ${end}%`);
    acc = end;
  });

  const conicGradient = `conic-gradient(${gradientParts.join(', ')})`;

  const getSectorInfo = (index: number) => {
    const startAngle = percentages.slice(0, index).reduce((a, b) => a + b, 0);
    const angle = percentages[index];
    return { startAngle, angle };
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '260px',
          height: '260px',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: animated ? conicGradient : 'transparent',
            transform: animated ? 'rotate(0deg)' : 'rotate(-180deg)',
            opacity: animated ? 1 : 0,
            transition: 'transform 0.6s ease-out, opacity 0.4s ease-out',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-modal)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <span
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {totalVotes}
          </span>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            总票数
          </span>
        </div>

        {percentages.map((pct, index) => {
          const { startAngle, angle } = getSectorInfo(index);
          if (pct <= 0) return null;

          const midAngle = startAngle + angle / 2;
          const radius = 95;
          const rad = (midAngle - 90) * (Math.PI / 180);
          const x = 130 + radius * Math.cos(rad);
          const y = 130 + radius * Math.sin(rad);

          const isHovered = hoveredIndex === index;
          const scale = isHovered ? 1.1 : 1;
          const zIndex = isHovered ? 10 : 1;

          return (
            <div
              key={`hover-${options[index].id}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                transform: `translate(-50%, -50%) scale(${scale})`,
                transition: 'transform 0.2s ease-out',
                zIndex,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {pct >= 5 && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#fff',
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                  }}
                >
                  {Math.round(pct)}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          width: '100%',
        }}
      >
        {options.map((option, index) => {
          const pct = percentages[index];
          const isUserChoice = option.id === userOptionId;
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={option.id}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                backgroundColor: isHovered ? 'var(--bg-component)' : 'transparent',
                borderRadius: '8px',
                transition: 'background-color 0.2s',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '3px',
                  backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    color: isUserChoice
                      ? 'var(--accent-success)'
                      : 'var(--text-primary)',
                    fontWeight: isUserChoice ? 600 : 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {option.text}
                  {isUserChoice && (
                    <span style={{ marginLeft: '4px', fontSize: '11px' }}>
                      ✓
                    </span>
                  )}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {option.voteCount} 票 · {Math.round(pct)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
