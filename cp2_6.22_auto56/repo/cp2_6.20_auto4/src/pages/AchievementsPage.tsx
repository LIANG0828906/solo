import AchievementSystem from '@/components/AchievementSystem';

export default function AchievementsPage() {
  return (
    <div className="container mx-auto px-4 pt-20 pb-8">
      <h1 className="mb-6 font-serif text-2xl font-bold text-text">我的成就</h1>
      <AchievementSystem />
    </div>
  );
}
