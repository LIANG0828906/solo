import { useGameStore } from '../store/useGameStore';

export function GameOverScreen() {
  const { gameStatus, generateNewMap, player, exploredRooms, totalRooms, elapsedTime } = useGameStore(
    (state) => ({
      gameStatus: state.gameStatus,
      generateNewMap: state.generateNewMap,
      player: state.player,
      exploredRooms: state.exploredRooms,
      totalRooms: state.totalRooms,
      elapsedTime: state.elapsedTime,
    })
  );

  if (gameStatus !== 'lost') return null;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-over-screen">
      <div className="game-over-content">
        <h1 className="game-over-title">Game Over</h1>
        <p className="game-over-subtitle">你的冒险在此终结...</p>
        <div className="game-over-stats">
          <div className="stat-item">
            <span className="stat-label">探索房间</span>
            <span className="stat-value">{exploredRooms} / {totalRooms}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">存活时间</span>
            <span className="stat-value">{formatTime(elapsedTime)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">剩余生命</span>
            <span className="stat-value">{player.health}</span>
          </div>
        </div>
        <button className="primary-btn restart-btn" onClick={generateNewMap}>
          重新开始
        </button>
      </div>
    </div>
  );
}
