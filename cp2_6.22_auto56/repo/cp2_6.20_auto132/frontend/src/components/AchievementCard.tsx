import type { Achievement } from '../types';

interface AchievementCardProps {
  achievement: Achievement;
  index: number;
}

const AchievementCard = ({ achievement, index }: AchievementCardProps) => {
  const isLocked = !achievement.unlocked;
  const animationDelay = `${index * 0.1}s`;

  return (
    <div
      className="card"
      style={{
        animation: `slideUp 0.5s ease-out ${animationDelay} both`,
        opacity: isLocked ? 0.5 : 1,
        filter: isLocked ? 'grayscale(100%)' : 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
        }}
      >
        <div
          style={{
            fontSize: '3rem',
            lineHeight: 1,
          }}
        >
          {isLocked ? '🔒' : achievement.emoji}
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <h3
            style={{
              fontSize: '1.2rem',
              fontWeight: '700',
              marginBottom: '0.5rem',
              color: 'var(--text-primary)',
            }}
          >
            {achievement.name}
          </h3>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              marginBottom: '0.75rem',
              lineHeight: '1.5',
            }}
          >
            {achievement.description}
          </p>
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--accent)',
              backgroundColor: 'rgba(255, 107, 53, 0.1)',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              display: 'inline-block',
            }}
          >
            解锁条件: {achievement.condition}
          </div>
          {achievement.unlocked_at && (
            <div
              style={{
                marginTop: '0.5rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}
            >
              解锁于 {new Date(achievement.unlocked_at).toLocaleDateString('zh-CN')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementCard;
