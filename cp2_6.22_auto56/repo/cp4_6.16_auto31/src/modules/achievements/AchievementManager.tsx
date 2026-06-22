import React, { useEffect, useMemo, useRef } from 'react';
import { useHabitStore, BadgeLevel, Badge } from '../../store';

const badgeColors: Record<BadgeLevel, { primary: string; secondary: string; glow: string }> = {
  bronze: {
    primary: '#cd7f32',
    secondary: '#b87333',
    glow: 'rgba(205, 127, 50, 0.6)',
  },
  silver: {
    primary: '#c0c0c0',
    secondary: '#a8a8a8',
    glow: 'rgba(192, 192, 192, 0.6)',
  },
  gold: {
    primary: '#ffd700',
    secondary: '#daa520',
    glow: 'rgba(255, 215, 0, 0.6)',
  },
};

const badgeLevelNames: Record<BadgeLevel, string> = {
  bronze: '青铜徽章',
  silver: '白银徽章',
  gold: '黄金徽章',
};

interface CoinProps {
  delay: number;
  left: number;
  duration: number;
  color: string;
}

const Coin: React.FC<CoinProps> = ({ delay, left, duration, color }) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${left}%`,
    top: '-60px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: `radial-gradient(circle at 30% 30%, ${color}, #b8860b)`,
    boxShadow: `0 0 10px ${color}, inset 0 0 5px rgba(255,255,255,0.5)`,
    animation: `coinFall ${duration}s ease-out ${delay}s forwards`,
    opacity: 0,
  };

  return <div style={style} />;
};

const BadgeShield: React.FC<{ level: BadgeLevel }> = ({ level }) => {
  const colors = badgeColors[level];

  return (
    <svg
      viewBox="0 0 100 120"
      width="120"
      height="144"
      style={{
        filter: `drop-shadow(0 0 20px ${colors.glow})`,
      }}
    >
      <defs>
        <linearGradient id={`shieldGrad-${level}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.primary} />
          <stop offset="100%" stopColor={colors.secondary} />
        </linearGradient>
        <linearGradient id={`shineGrad-${level}`} x1="-100%" y1="0%" x2="200%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <path
        d="M50 5 L90 20 L90 65 Q90 100 50 115 Q10 100 10 65 L10 20 Z"
        fill={`url(#shieldGrad-${level})`}
        stroke={colors.primary}
        strokeWidth="2"
      />
      <path
        d="M50 5 L90 20 L90 65 Q90 100 50 115 Q10 100 10 65 L10 20 Z"
        fill={`url(#shineGrad-${level})`}
        style={{
          animation: 'shimmer 2s infinite linear',
        }}
      />
      <polygon
        points="50,35 57,55 78,55 61,68 68,88 50,75 32,88 39,68 22,55 43,55"
        fill="#fff"
        opacity="0.95"
      />
      <polygon
        points="50,35 57,55 78,55 61,68 68,88 50,75 32,88 39,68 22,55 43,55"
        fill="url(#shineGrad-gold)"
        style={{
          animation: 'shimmer 2s infinite linear',
        }}
      />
    </svg>
  );
};

const AchievementManager: React.FC = () => {
  const { showAchievement, setShowAchievement, habits, badges, getStreakDays } = useHabitStore();
  const shownAchievementsRef = useRef<Set<string>>(new Set());
  const hasCheckedInitialRef = useRef(false);

  const coins = useMemo(() => {
    if (!showAchievement) return [];
    const coinCount = Math.floor(Math.random() * 6) + 10;
    return Array.from({ length: coinCount }, (_, i) => ({
      id: i,
      delay: Math.random() * 0.8,
      left: Math.random() * 80 + 10,
      duration: 0.8 + Math.random() * 0.6,
      color: badgeColors[showAchievement.level].primary,
    }));
  }, [showAchievement]);

  useEffect(() => {
    if (hasCheckedInitialRef.current) return;

    const checkInitialAchievements = () => {
      const state = useHabitStore.getState();
      const { habits, badges, getStreakDays } = state;

      habits.forEach((habit) => {
        const streak = getStreakDays(habit.id);
        const existingBadge = badges.find((b) => b.habitId === habit.id);

        let shouldShow: Badge | null = null;
        if (streak >= 30 && existingBadge?.level === 'gold') {
          shouldShow = existingBadge;
        } else if (streak >= 14 && existingBadge?.level === 'silver') {
          shouldShow = existingBadge;
        } else if (streak >= 7 && existingBadge?.level === 'bronze') {
          shouldShow = existingBadge;
        }

        if (shouldShow && !shownAchievementsRef.current.has(shouldShow.id)) {
          shownAchievementsRef.current.add(shouldShow.id);
        }
      });

      hasCheckedInitialRef.current = true;
    };

    const unsubscribe = useHabitStore.subscribe((state) => {
      if (!hasCheckedInitialRef.current && state.habits.length > 0) {
        checkInitialAchievements();
      }
    });

    const state = useHabitStore.getState();
    if (state.habits.length > 0) {
      checkInitialAchievements();
    }

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!showAchievement) return;

    if (shownAchievementsRef.current.has(showAchievement.id)) {
      setShowAchievement(null);
      return;
    }

    shownAchievementsRef.current.add(showAchievement.id);

    const timer = setTimeout(() => {
      setShowAchievement(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showAchievement, setShowAchievement]);

  if (!showAchievement) return null;

  const habit = habits.find((h) => h.id === showAchievement.habitId);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.3s ease-out',
        overflow: 'hidden',
      }}
      onClick={() => setShowAchievement(null)}
    >
      {coins.map((coin) => (
        <Coin key={coin.id} {...coin} />
      ))}

      <div
        style={{
          textAlign: 'center',
          animation: 'scaleIn 0.5s ease-out',
          position: 'relative',
          zIndex: 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: '20px' }}>
          <BadgeShield level={showAchievement.level} />
        </div>

        <h2
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '8px',
            textShadow: '0 0 20px rgba(255,255,255,0.5)',
          }}
        >
          解锁成就！
        </h2>

        <p
          style={{
            fontSize: '20px',
            color: badgeColors[showAchievement.level].primary,
            fontWeight: '600',
            marginBottom: '4px',
          }}
        >
          {badgeLevelNames[showAchievement.level]}
        </p>

        {habit && (
          <p
            style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '8px',
            }}
          >
            {habit.emoji} {habit.name}
          </p>
        )}

        <p
          style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          连续打卡 {showAchievement.streakDays} 天
        </p>
      </div>
    </div>
  );
};

export default AchievementManager;
