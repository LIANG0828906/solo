import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Challenge } from '@/types';

interface ChallengeCardProps {
  challenge: Challenge;
  index: number;
}

const getDifficultyStyle = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return { color: '#22C55E', label: '简单' };
    case 'medium':
      return { color: '#EAB308', label: '中等' };
    case 'hard':
      return { color: '#EF4444', label: '困难' };
    default:
      return { color: '#6366F1', label: '未知' };
  }
};

export const ChallengeCard = memo(function ChallengeCard({ challenge, index }: ChallengeCardProps) {
  const navigate = useNavigate();
  const diffStyle = getDifficultyStyle(challenge.difficulty);

  const handleClick = () => {
    navigate(`/challenge/${challenge.id}/submit`);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        animation: `fadeIn 0.25s ease forwards`,
        animationDelay: `${index * 0.05}s`,
        opacity: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(0, 0, 0, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          width: 4,
          backgroundColor: diffStyle.color,
          flexShrink: 0,
        }}
      />

      <div
        style={{
          padding: 20,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            {challenge.title}
          </h3>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: diffStyle.color,
              backgroundColor: `${diffStyle.color}1A`,
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
            }}
          >
            {diffStyle.label}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          {challenge.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-tertiary)',
                padding: '3px 8px',
                borderRadius: 4,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <p
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {challenge.description.replace(/[#*`\n]/g, ' ').trim().slice(0, 80)}...
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 4,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: 'var(--text-muted)',
            }}
          >
            <span>📝</span>
            <span>{challenge.submissions} 次提交</span>
          </div>
          <button
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--accent-primary)',
              backgroundColor: 'transparent',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--accent-primary)';
            }}
          >
            开始挑战
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
});
