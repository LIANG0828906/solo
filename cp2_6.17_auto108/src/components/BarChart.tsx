import { useEffect, useState } from 'react';
import type { VoteOption } from '../types';

interface BarChartProps {
  options: VoteOption[];
  totalVotes: number;
  userOptionId?: string;
}

export function BarChart({ options, totalVotes, userOptionId }: BarChartProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const maxVoteCount = Math.max(...options.map((o) => o.voteCount), 1);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {options.map((option, index) => {
        const percentage =
          totalVotes > 0
            ? Math.round((option.voteCount / totalVotes) * 100)
            : 0;
        const isUserChoice = option.id === userOptionId;

        return (
          <div
          key={option.id}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                minWidth: 0,
                flex: 1,
              }}
            >
              <span
              style={{
                fontSize: '14px',
                color: isUserChoice
                  ? 'var(--accent-success)'
                  : 'var(--text-primary)',
                fontWeight: isUserChoice ? 600 : 500,
              }}
            >
              {option.text}
            </span>
              {isUserChoice && (
                <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  backgroundColor: 'rgba(0, 212, 170, 0.15)',
                  color: 'var(--accent-success)',
                  borderRadius: '4px',
                  fontWeight: 500,
                }}
              >
                你的选择
              </span>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}
              >
                {option.voteCount} 票
              </span>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--accent-primary)',
                  minWidth: '40px',
                  textAlign: 'right',
                }}
              >
                {percentage}%
              </span>
            </div>
          </div>
          <div
            style={{
              height: '32px',
              backgroundColor: 'var(--bg-component)',
              borderRadius: '8px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              key={`bar-${option.id}`}
              style={{
                height: '100%',
                width: animated
                  ? `${(option.voteCount / maxVoteCount) * 100}%`
                  : '0%',
                background: `linear-gradient(90deg, var(--accent-primary), var(--accent-success))`,
                borderRadius: '8px',
                transition: 'width 0.5s ease-out',
                transitionDelay: `${index * 80}ms`,
                animationDelay: `${index * 80}ms`,
              }}
            />
          </div>
        </div>
        );
      })}
      <div
        style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          paddingTop: '4px',
        }}
      >
        共 {totalVotes} 人参与投票
      </div>
    </div>
  );
}
