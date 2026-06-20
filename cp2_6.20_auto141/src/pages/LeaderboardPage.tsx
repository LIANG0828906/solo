import Leaderboard from '@/components/Leaderboard';
import SkinCustomizer from '@/components/SkinCustomizer';

export default function LeaderboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1
          className="text-3xl font-bold mb-2"
          style={{
            color: 'var(--neon-cyan)',
            textShadow: '0 0 20px rgba(0, 245, 212, 0.5)',
          }}
        >
          排行榜
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          查看全球玩家排名，定制你的专属角色！
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Leaderboard />
        </div>
        <div>
          <SkinCustomizer />
        </div>
      </div>
    </div>
  );
}
