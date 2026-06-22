import { useGameStore } from '../store/useGameStore';

export function VictoryScreen() {
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

  if (gameStatus !== 'won') return null;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="victory-screen">
      <div className="victory-content">
        <h1 className="victory-title">Victory!</h1>
        <p className="victory-subtitle">你成功探索了所有房间！</p>
        <div className="victory-stats">
          <div className="stat-item">
            <span className="stat-label">探索房间</span>
            <span className="stat-value">{exploredRooms} / {totalRooms}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">用时</span>
            <span className="stat-value">{formatTime(elapsedTime)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">剩余生命</span>
            <span className="stat-value">{player.health}</span>
          </div>
        </div>
        <button className="primary-btn restart-btn" onClick={generateNewMap}>
          再来一局
        </button>
      </div>
    </div>
  );
}
