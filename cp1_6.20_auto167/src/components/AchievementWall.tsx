import { useState, useEffect } from 'react';
import type { Badge, PlayerStats } from '../types';

interface AchievementWallProps {
  badges: Badge[];
  unlockedBadges: string[];
  playerStats: PlayerStats | null;
  isOwnWall: boolean;
  isModal?: boolean;
}

function AchievementWall({
  badges,
  unlockedBadges,
  playerStats,
  isOwnWall,
  isModal = false,
}: AchievementWallProps) {
  const [animatingBadges, setAnimatingBadges] = useState<Set<string>>(new Set());
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  useEffect(() => {
    const newUnlocks = unlockedBadges.filter((id) => {
      const badge = badges.find((b) => b.id === id);
      return badge && !animatingBadges.has(id);
    });

    if (newUnlocks.length > 0) {
      newUnlocks.forEach((id, index) => {
        setTimeout(() => {
          setAnimatingBadges((prev) => new Set([...prev, id]));
          setTimeout(() => {
            setAnimatingBadges((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }, 600);
        }, index * 150);
      });
    }
  }, [unlockedBadges, badges]);

  const getProgress = (badge: Badge) => {
    if (!playerStats) return { current: 0, total: 1, percent: 0 };
    const { current, total } = badge.progress(playerStats);
    return {
      current,
      total,
      percent: Math.min((current / total) * 100, 100),
    };
  };

  const formatProgressValue = (badge: Badge, current: number, total: number) => {
    if (badge.id.includes('survival') || badge.id === 'survivor_30min' || badge.id === 'survival_100min') {
      const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        return `${mins}m`;
      };
      return `${formatTime(current)} / ${formatTime(total)}`;
    }
    return `${current} / ${total}`;
  };

  const displayBadges = isOwnWall
    ? badges
    : badges.filter((b) => unlockedBadges.includes(b.id));

  if (isModal) {
    return (
      <div>
        <h3 className="section-title">
          <span className="section-title-icon">🏅</span>
          Achievement Wall
          {!isOwnWall && (
            <span style={{ fontSize: '0.75rem', color: '#666688', marginLeft: 'auto' }}>
              Only unlocked badges shown
            </span>
          )}
        </h3>
        <div className="modal-badge-grid">
          {displayBadges.map((badge) => {
            const isUnlocked = unlockedBadges.includes(badge.id);
            const progress = getProgress(badge);
            const isAnimating = animatingBadges.has(badge.id);

            return (
              <div
                key={badge.id}
                className={`modal-badge-item ${isUnlocked ? 'unlocked' : 'locked'}`}
                onClick={() => setSelectedBadge(badge)}
              >
                <div
                  className={`badge-icon ${badge.tier} ${
                    isUnlocked ? 'unlocked' : 'locked'
                  } ${isAnimating ? 'animating' : ''}`}
                >
                  <span className="badge-shine" />
                  {isUnlocked ? badge.icon : '🔒'}
                </div>
                <span className="modal-badge-name">{badge.name}</span>
                <span className="modal-badge-desc">{badge.description}</span>
                {isOwnWall && !isUnlocked && (
                  <div className="badge-progress-bar">
                    <div
                      className="badge-progress-fill"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                )}
                {isOwnWall && !isUnlocked && (
                  <span className="badge-progress-text">
                    {formatProgressValue(badge, progress.current, progress.total)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="achievement-card">
      <h3 className="section-title">
        <span className="section-title-icon">🏅</span>
        My Achievements
        <span style={{ fontSize: '0.8rem', color: '#666688', marginLeft: 'auto' }}>
          {unlockedBadges.length} / {badges.length}
        </span>
      </h3>
      <div className="badge-grid">
        {badges.map((badge) => {
          const isUnlocked = unlockedBadges.includes(badge.id);
          const progress = getProgress(badge);
          const isAnimating = animatingBadges.has(badge.id);

          return (
            <div
              key={badge.id}
              className={`badge-item ${isUnlocked ? 'unlocked' : 'locked'}`}
              title={badge.description}
            >
              <div
                className={`badge-icon ${badge.tier} ${isUnlocked ? 'unlocked' : 'locked'} ${
                  isAnimating ? 'animating' : ''
                }`}
              >
                <span className="badge-shine" />
                {isUnlocked ? badge.icon : '🔒'}
              </div>
              <span className="badge-name">{badge.name}</span>
              {!isUnlocked && (
                <div className="badge-progress-bar">
                  <div
                    className="badge-progress-fill"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              )}
              {!isUnlocked && (
                <span className="badge-progress-text">
                  {formatProgressValue(badge, progress.current, progress.total)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AchievementWall;
