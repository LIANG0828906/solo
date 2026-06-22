import React, { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { getAchievements } from '../utils/storage';

const Achievements: React.FC = () => {
  const { achievements, setAchievements, setScene } = useGameStore();

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    const data = await getAchievements();
    setAchievements(data);
  };

  return (
    <div className="w-full h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-yellow-400">成就徽章</h2>
        <button className="btn" onClick={() => setScene('menu')}>
          返回
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto scrollable">
        {achievements.map(achievement => (
          <div
            key={achievement.id}
            className={`card p-6 transition-all ${
              achievement.unlocked
                ? 'border-yellow-500/50 bg-yellow-500/10'
                : 'opacity-50'
            }`}
          >
            <div className="flex items-center gap-4 mb-3">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
                  achievement.unlocked
                    ? 'bg-yellow-500/30'
                    : 'bg-gray-700/50'
                }`}
              >
                {achievement.unlocked ? '🏆' : '🔒'}
              </div>
              <div>
                <h3 className={`text-lg font-bold ${
                  achievement.unlocked ? 'text-yellow-400' : 'text-gray-500'
                }`}>
                  {achievement.name}
                </h3>
                <p className="text-sm text-gray-400">{achievement.description}</p>
              </div>
            </div>

            {achievement.unlocked && achievement.unlockedAt && (
              <p className="text-xs text-gray-500 text-right">
                解锁于 {new Date(achievement.unlockedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-500">
          已解锁 {achievements.filter(a => a.unlocked).length} / {achievements.length} 个成就
        </p>
      </div>
    </div>
  );
};

export default Achievements;
