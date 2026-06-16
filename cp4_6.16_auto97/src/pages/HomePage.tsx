import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { useStore } from '@/store';
import ChallengeCard from '@/components/ChallengeCard';
import StatsDashboard from '@/components/StatsDashboard';
import AchievementBadge from '@/components/AchievementBadge';

export default function HomePage() {
  const navigate = useNavigate();
  const {
    challenges,
    searchQuery,
    difficultyFilter,
    userStats,
    achievements,
    setSearchQuery,
    setDifficultyFilter,
    setCurrentChallenge,
    showAchievementAnimation,
    newlyUnlockedAchievement,
    dismissAchievementAnimation,
  } = useStore();

  const filteredChallenges = useMemo(() => {
    return challenges.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = difficultyFilter === 'all' || c.difficulty === difficultyFilter;
      return matchesSearch && matchesDifficulty;
    });
  }, [challenges, searchQuery, difficultyFilter]);

  const handleCardClick = (challenge: typeof challenges[0]) => {
    setCurrentChallenge(challenge);
    navigate(`/challenge/${challenge.id}`);
  };

  return (
    <div className="flex h-full">
      <div className="w-[380px] shrink-0 flex flex-col border-r border-[#45475a] h-full">
        <div className="p-4 space-y-3 border-b border-[#45475a]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6c7086]" />
            <input
              type="text"
              placeholder="搜索题目..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#45475a] bg-[#2b2b3d] py-2 pl-9 pr-3 text-sm text-text-primary placeholder-[#6c7086] outline-none transition-colors duration-200 focus:border-accent"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6c7086]" />
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as 'all' | 'easy' | 'medium' | 'hard')}
              className="w-full appearance-none rounded-lg border border-[#45475a] bg-[#2b2b3d] py-2 pl-9 pr-8 text-sm text-text-primary outline-none transition-colors duration-200 focus:border-accent"
            >
              <option value="all">全部难度</option>
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
          <div className="grid grid-cols-1 gap-3">
            {filteredChallenges.map((challenge, index) => (
              <div
                key={challenge.id}
                className={`animate-stagger-${Math.min(index + 1, 10)}`}
              >
                <ChallengeCard
                  challenge={challenge}
                  solvedChallengeIds={userStats.solvedChallengeIds}
                  onClick={() => handleCardClick(challenge)}
                />
              </div>
            ))}
            {filteredChallenges.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-[#6c7086]">
                <Search size={32} className="mb-2 opacity-50" />
                <p className="text-sm">未找到匹配的题目</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text-primary mb-1">CodeQuest</h1>
            <p className="text-sm text-text-secondary">编程挑战与解题进度追踪</p>
          </div>

          <StatsDashboard stats={userStats} challenges={challenges} />

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">成就徽章</h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {achievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  isAnimating={false}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {showAchievementAnimation && newlyUnlockedAchievement && (
        <div className="achievement-overlay" onClick={dismissAchievementAnimation}>
          <div className="flex flex-col items-center">
            <div className="achievement-icon-anim text-6xl">
              {newlyUnlockedAchievement.icon}
            </div>
            <div className="mt-4 animate-fade-in text-center">
              <p className="text-lg font-bold text-accent">成就解锁!</p>
              <p className="text-sm text-text-primary">{newlyUnlockedAchievement.name}</p>
              <p className="text-xs text-text-secondary">{newlyUnlockedAchievement.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
