import { useEffect } from 'react';
import AchievementCard from '../components/AchievementCard';
import { useStore } from '../store/useStore';

const AchievementsPage = () => {
  const { achievements, loading, fetchAchievements } = useStore();

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="page-container">
      <div
        style={{
          marginBottom: '2rem',
        }}
      >
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '0.5rem',
            color: 'var(--text-primary)',
          }}
        >
          成就系统
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
          }}
        >
          已解锁 {unlockedCount}/{achievements.length} 个成就
        </p>
        {achievements.length > 0 && (
          <div
            style={{
              marginTop: '1rem',
              height: '8px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                backgroundColor: 'var(--accent)',
                borderRadius: '4px',
                width: `${(unlockedCount / achievements.length) * 100}%`,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        )}
      </div>

      {loading && achievements.length === 0 ? (
        <div className="loading">加载中...</div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {achievements.map((achievement, index) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AchievementsPage;
