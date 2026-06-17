import { useGameStore } from '../store/useGameStore';

export default function VictoryModal() {
  const { state, restartGame } = useGameStore();
  const { gameOver, winner, players } = state;

  if (!gameOver || !winner) return null;

  const winnerName = winner === 'player' ? '玩家' : 'AI';
  const winnerState = players[winner];

  return (
    <div className="victory-overlay">
      <div className="victory-modal">
        <h2 className="victory-title">游戏结束</h2>
        <div
          className={`victory-winner ${winner === 'player' ? 'player-color' : 'ai-color'}`}
        >
          {winnerName} 获胜！
        </div>
        <div className="victory-stats">
          <div className="stat-row">
            <span>最终积分</span>
            <span className="stat-value">{winnerState.score}</span>
          </div>
          <div className="stat-row">
            <span>采集符文</span>
            <span className="stat-value">{winnerState.runesCollected}</span>
          </div>
        </div>
        <button className="victory-btn" onClick={restartGame}>
          再来一局
        </button>
      </div>
    </div>
  );
}
