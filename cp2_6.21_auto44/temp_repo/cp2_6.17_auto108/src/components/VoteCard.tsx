import { Check } from 'lucide-react';
import type { VoteTopic } from '../types';
import { CountdownTimer } from './CountdownTimer';

interface VoteCardProps {
  topic: VoteTopic;
  hasVoted: boolean;
  onClick: () => void;
}

export function VoteCard({ topic, hasVoted, onClick }: VoteCardProps) {
  const isOngoing = topic.status === 'ongoing';

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid var(--border-default)',
        cursor: 'pointer',
        transition: 'all 0.25s ease-out',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-primary)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-default)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: 0,
            flex: 1,
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isOngoing ? 'var(--accent-success)' : 'var(--accent-danger)',
              flexShrink: 0,
            }}
            className={isOngoing ? 'animate-pulse-dot' : 'animate-blink-dot'}
          />
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {topic.title}
          </h3>
        </div>

        {hasVoted && (
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Check size={14} style={{ color: '#fff' }} strokeWidth={3} />
          </div>
        )}
      </div>

      {topic.description && (
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.5,
          }}
        >
          {topic.description}
        </p>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-default)',
        }}
      >
        <CountdownTimer deadline={topic.deadline} variant="card" />

        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}
        >
          {topic.totalVotes} 票 · {topic.options.length} 选项
        </div>
      </div>
    </div>
  );
}
