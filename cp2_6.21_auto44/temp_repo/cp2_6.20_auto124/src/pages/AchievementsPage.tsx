import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useStore';
import type { Achievement } from '@/types';

export default function AchievementsPage() {
  const { achievements, fetchAchievements } = useAppStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    fetchAchievements();
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [fetchAchievements]);

  return (
    <div
      className={`min-h-screen bg-[#1a1d24] text-white transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">成就墙</h1>

        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          }}
        >
          {achievements.map((achievement, index) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

function AchievementCard({
  achievement,
  delay,
}: {
  achievement: Achievement;
  delay: number;
}) {
  const { unlocked, icon, name, condition } = achievement;

  return (
    <div
      className="relative p-6 opacity-0 animate-fade-in-up"
      style={{
        backgroundColor: '#23262e',
        borderRadius: '12px',
        border: unlocked ? '1px solid rgba(255, 107, 53, 0.3)' : '1px solid transparent',
        boxShadow: unlocked ? '0 0 20px rgba(255, 107, 53, 0.15)' : 'none',
        animationDelay: `${delay}s`,
        animationFillMode: 'forwards',
      }}
    >
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl z-10">
          <span className="text-4xl">🔒</span>
        </div>
      )}

      <div className={!unlocked ? 'grayscale opacity-50' : ''}>
        <div className="text-5xl mb-4">{icon}</div>
        <h3 className="text-lg font-semibold mb-2 text-white">{name}</h3>
        <p className="text-sm text-gray-400">{condition}</p>
      </div>
    </div>
  );
}
