import { useGameStore } from '../store/useGameStore';

export function ControlPanel() {
  const { player, exploredRooms, totalRooms, elapsedTime, generateNewMap, gameStatus } = useGameStore(
    (state) => ({
      player: state.player,
      exploredRooms: state.exploredRooms,
      totalRooms: state.totalRooms,
      elapsedTime: state.elapsedTime,
      generateNewMap: state.generateNewMap,
      gameStatus: state.gameStatus,
    })
  );

  const healthPercent = (player.health / player.maxHealth) * 100;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="control-panel">
      <h2 className="panel-title">冒险者状态</h2>

      <div className="panel-section">
        <label className="panel-label">生命值</label>
        <div className="health-bar-container">
          <div
            className="health-bar"
            style={{ width: `${healthPercent}%` }}
          />
          <span className="health-text">
            {player.health} / {player.maxHealth}
          </span>
        </div>
      </div>

      <div className="panel-section">
        <div className="info-row">
          <span className="info-label">探索进度</span>
          <span className="info-value">
            {exploredRooms} / {totalRooms} 房间
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">游戏时间</span>
          <span className="info-value">{formatTime(elapsedTime)}</span>
        </div>
      </div>

      <div className="panel-section">
        <label className="panel-label">操作说明</label>
        <p className="help-text">使用 ↑ ↓ ← → 方向键移动角色</p>
        <p className="help-text">进入新房间会触发随机事件</p>
      </div>

      <button
        className="primary-btn"
        onClick={generateNewMap}
        disabled={gameStatus !== 'playing'}
      >
        重新生成地图
      </button>
    </div>
  );
}
