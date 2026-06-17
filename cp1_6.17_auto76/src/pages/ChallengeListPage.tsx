import { useEffect, useState } from 'react';
import { useChallengeStore } from '@/store/challengeStore';
import { ChallengeCard } from '@/components/ChallengeCard';
import type { DifficultyFilter } from '@/types';

const filters: { key: DifficultyFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'easy', label: '简单' },
  { key: 'medium', label: '中等' },
  { key: 'hard', label: '困难' },
];

const getFilterColor = (key: DifficultyFilter): string => {
  switch (key) {
    case 'easy':
      return '#22C55E';
    case 'medium':
      return '#EAB308';
    case 'hard':
      return '#EF4444';
    default:
      return '#6366F1';
  }
};

export const ChallengeListPage = () => {
  const loadChallenges = useChallengeStore((s) => s.loadChallenges);
  const getFilteredChallenges = useChallengeStore((s) => s.getFilteredChallenges);
  const currentFilter = useChallengeStore((s) => s.filter);
  const setFilter = useChallengeStore((s) => s.setFilter);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  const challenges = getFilteredChallenges();

  const handleFilterChange = (filter: DifficultyFilter) => {
    if (filter === currentFilter) return;
    setAnimating(true);
    setTimeout(() => {
      setFilter(filter);
      setAnimating(false);
    }, 125);
  };

  const groupedChallenges: Record<string, typeof challenges> = {};
  challenges.forEach((c) => {
    if (!groupedChallenges[c.difficulty]) {
      groupedChallenges[c.difficulty] = [];
    }
    groupedChallenges[c.difficulty].push(c);
  });

  const difficultyOrder = ['easy', 'medium', 'hard'];
  const difficultyLabels: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '96px 24px 48px',
      }}
    >
      <div
        style={{
          marginBottom: 32,
        }}
      >
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 8,
            letterSpacing: '-0.02em',
          }}
        >
          编码挑战
        </h1>
        <p
          style={{
            fontSize: 15,
            color: 'var(--text-secondary)',
          }}
        >
          选择一个挑战，编写你的解决方案，与社区共同进步
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 32,
          flexWrap: 'wrap',
        }}
      >
        {filters.map((f) => {
          const isActive = f.key === currentFilter;
          const color = getFilterColor(f.key);
          return (
            <button
              key={f.key}
              onClick={() => handleFilterChange(f.key)}
              style={{
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: isActive ? color : 'var(--border-color)',
                backgroundColor: isActive ? `${color}1A` : 'transparent',
                color: isActive ? color : 'var(--text-secondary)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = color;
                  e.currentTarget.style.color = color;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
        }}
      >
        {currentFilter === 'all' ? (
          difficultyOrder.map((diff) => {
            const group = groupedChallenges[diff] || [];
            if (group.length === 0) return null;
            return (
              <div key={diff} style={{ marginBottom: 40 }}>
                <h2
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: getFilterColor(diff as DifficultyFilter),
                    marginBottom: 16,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {difficultyLabels[diff]} ({group.length})
                </h2>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                    gap: 20,
                  }}
                >
                  {group.map((challenge, idx) => (
                    <ChallengeCard key={challenge.id} challenge={challenge} index={idx} />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
              gap: 20,
            }}
          >
            {challenges.map((challenge, idx) => (
              <ChallengeCard key={challenge.id} challenge={challenge} index={idx} />
            ))}
          </div>
        )}

        {challenges.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 24px',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: 16 }}>暂无匹配的挑战</p>
          </div>
        )}
      </div>
    </div>
  );
};
