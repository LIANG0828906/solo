import React from 'react';
import { useGameStore } from '../store/gameStore';
import { formatTime } from '../utils/gameUtils';
import './StatusPanel.css';

export const StatusPanel: React.FC = () => {
  const {
    units,
    currentTurn,
    turnNumber,
    history,
    message,
    winner,
    gamePhase,
    mapSize,
    terrain,
  } = useGameStore();

  const initGame = useGameStore((state) => state.initGame);

  const playerUnits = units.filter((u) => u.team === 'player');
  const aiUnits = units.filter((u) => u.team === 'ai');

  const renderUnitList = (unitList: typeof units, title: string, color: string) => (
    <div className="unit-list-section">
      <h4 className="list-title" style={{ color }}>
        {title}
      </h4>
      <div className="unit-list">
        {unitList.map((unit) => (
          <div
            key={unit.id}
            className={`unit-list-item ${!unit.isAlive ? 'unit-dead' : ''}`}
          >
            <div
              className="unit-list-dot"
              style={{ backgroundColor: unit.isAlive ? color : '#7f8c8d' }}
            />
            <span className="unit-list-name">{unit.name}</span>
            {unit.isAlive ? (
              <div className="unit-list-hp">
                <div
                  className="unit-list-hp-bar"
                  style={{
                    width: `${(unit.hp / unit.maxHp) * 100}%`,
                    backgroundColor:
                      unit.hp / unit.maxHp > 0.5
                        ? '#2ecc71'
                        : unit.hp / unit.maxHp > 0.25
                        ? '#f1c40f'
                        : '#e74c3c',
                  }}
                />
              </div>
            ) : (
              <span className="dead-text">阵亡</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const handleReplay = (record: typeof history[0]) => {
    console.log('回放决策:', record);
    alert(`回放 ${record.unitName} 的行动\n移动距离: ${record.moveDistance}\n${record.attackResult ? `攻击结果: ${record.attackResult}` : '未攻击'}`);
  };

  return (
    <div className="status-panel">
      <div className="status-header">
        <h3 className="panel-title">战报</h3>
        <div className="turn-info">
          <span className="turn-number">回合 {turnNumber}</span>
          <span
            className={`turn-badge ${currentTurn === 'player' ? 'player-turn' : 'ai-turn'}`}
          >
            {currentTurn === 'player' ? '玩家回合' : 'AI回合'}
          </span>
        </div>
      </div>

      <div className="message-bar">{message}</div>

      {terrain.length === 0 && (
        <div className="map-select">
          <h4>选择地图大小</h4>
          <div className="map-size-buttons">
            <button className="map-size-btn" onClick={() => initGame(8)}>
              8×8
            </button>
            <button className="map-size-btn" onClick={() => initGame(10)}>
              10×10
            </button>
          </div>
        </div>
      )}

      {renderUnitList(playerUnits, '玩家单位', '#3498db')}
      {renderUnitList(aiUnits, 'AI单位', '#e74c3c')}

      <div className="history-section">
        <h4 className="list-title">AI决策记录</h4>
        {history.length === 0 ? (
          <div className="no-history">暂无记录</div>
        ) : (
          <div className="history-list">
            {history.map((record, index) => (
              <div
                key={record.id}
                className="history-item"
                onClick={() => handleReplay(record)}
              >
                <div className="history-header">
                  <span className="history-time">{formatTime(record.timestamp)}</span>
                  <span className="history-unit">{record.unitName}</span>
                </div>
                <div className="history-detail">
                  {record.moveDistance > 0 && (
                    <span className="history-move">移动 {record.moveDistance} 格</span>
                  )}
                  {record.attackResult && (
                    <span className="history-attack">
                      攻击 {record.targetUnitName}: {record.attackResult}
                      {record.damage && ` (${record.damage}伤害)`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {winner && (
        <div className="game-over">
          <h2 className="winner-text">
            {winner === 'player' ? '🎉 胜利！' : '💀 失败'}
          </h2>
          <p className="winner-desc">
            {winner === 'player' ? '恭喜你击败了所有敌人！' : 'AI 占领了战场...'}
          </p>
          <button className="restart-btn" onClick={() => initGame(mapSize)}>
            再来一局
          </button>
        </div>
      )}
    </div>
  );
};

export default StatusPanel;
