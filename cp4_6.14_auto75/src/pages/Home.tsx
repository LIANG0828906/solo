import GameCanvas from '@/game/GameCanvas';
import RankingBoard from '@/ranking/RankingBoard';

export default function Home() {
  return (
    <div className="app-container">
      <section className="game-section">
        <div style={{
          fontSize: 22,
          fontWeight: 800,
          color: '#fcd34d',
          marginBottom: 14,
          letterSpacing: 2,
        }}>
          ⚔️ 物品鉴定大师
        </div>
        <GameCanvas />
      </section>
      <section className="ranking-section">
        <RankingBoard />
      </section>
    </div>
  );
}
