import { useGameStore } from '../store';
import { wsService } from '../buzzer/websocketService';
import { RotateCcw, Trophy } from 'lucide-react';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const MEDAL_LABELS = ['🥇', '🥈', '🥉'];

export default function ResultScreen() {
  const rankings = useGameStore((s) => s.rankings);
  const players = useGameStore((s) => s.players);

  const handleRestart = () => {
    wsService.reset();
  };

  const enrichedRankings = rankings.map((r) => {
    const player = players.find((p) => p.id === r.playerId);
    return {
      ...r,
      correctCount: r.correctCount,
      avgTime: r.avgTime,
    };
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full py-8">
      <Trophy className="w-12 h-12 text-[#FFD700] mb-4" />
      <h2 className="neon-title text-3xl md:text-4xl font-bold mb-2">
        游戏结束
      </h2>
      <p className="text-[#A0A0A0] text-sm mb-8">最终排名</p>

      <div className="flex flex-col gap-4 w-full max-w-md mb-8">
        {enrichedRankings.slice(0, 3).map((r, i) => (
          <div
            key={r.playerId}
            className="result-card glass-panel p-6 rounded-2xl flex items-center gap-4"
            style={{
              backgroundColor: `${MEDAL_COLORS[i]}25`,
              borderColor: `${MEDAL_COLORS[i]}60`,
              borderWidth: '1px',
              animationDelay: `${i * 0.15}s`,
            }}
          >
            <span className="text-3xl">{MEDAL_LABELS[i]}</span>

            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
              style={{ backgroundColor: r.avatarColor }}
            >
              {r.nickname.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">
              <div className="text-white font-semibold text-lg">{r.nickname}</div>
              <div className="text-[#A0A0A0] text-sm">
                正确 {r.correctCount} 题 · 得分 {r.score} ·
                平均用时 {r.avgTime.toFixed(1)}s
              </div>
            </div>
          </div>
        ))}

        {enrichedRankings.length > 3 && (
          <div className="glass-panel p-4 rounded-2xl">
            {enrichedRankings.slice(3).map((r) => (
              <div
                key={r.playerId}
                className="flex items-center gap-3 py-2 border-b border-[#FFFFFF10] last:border-0"
              >
                <span className="text-[#A0A0A0] text-sm w-5 text-center">
                  {r.rank}
                </span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: r.avatarColor }}
                >
                  {r.nickname.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-white text-sm">{r.nickname}</div>
                <div className="text-[#6C63FF] font-bold text-sm">{r.score}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleRestart}
        className="btn-primary flex items-center gap-2 !rounded-[24px]"
      >
        <RotateCcw className="w-5 h-5" />
        再来一局
      </button>
    </div>
  );
}
