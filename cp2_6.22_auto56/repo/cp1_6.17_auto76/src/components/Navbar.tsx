import { useReviewStore } from '@/store/reviewStore';

interface NavbarProps {
  currentUser: { name: string } | null;
}

const getRankBadgeColor = (rank: number | undefined): string => {
  if (!rank) return '#6366F1';
  if (rank === 1) return '#FFD700';
  if (rank === 2) return '#C0C0C0';
  if (rank === 3) return '#CD7F32';
  return '#6366F1';
};

export const Navbar = ({ currentUser }: NavbarProps) => {
  const currentRanking = useReviewStore((s) => s.getCurrentUserRanking());
  const allRankings = useReviewStore((s) => s.getUserRankings());

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 64,
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {'</>'}
        </div>
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          CodeArena
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {allRankings.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'var(--bg-tertiary)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            <span>🏆</span>
            <span>
              {currentRanking
                ? `排名 #${currentRanking.rank} · 均分 ${currentRanking.averageScore}`
                : '暂无排名'}
            </span>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: getRankBadgeColor(currentRanking?.rank),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              color: currentRanking && currentRanking.rank <= 3 ? '#1E1B2E' : '#FFFFFF',
              boxShadow: currentRanking && currentRanking.rank <= 3
                ? `0 0 16px ${getRankBadgeColor(currentRanking.rank)}60`
                : 'none',
              transition: 'all 0.3s ease',
            }}
            title={
              currentRanking
                ? `排名第${currentRanking.rank}名，平均分${currentRanking.averageScore}`
                : '暂无排名'
            }
          >
            {currentRanking?.rank || '?'}
          </div>
          <span
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            {currentUser?.name || '访客'}
          </span>
        </div>
      </div>
    </nav>
  );
};
