import React from 'react';
import { useGameStore } from '../store/gameStore';
import './UnitPanel.css';

export const UnitPanel: React.FC = () => {
  const { units, selectedUnitId, attackableTargets, gamePhase, currentTurn } =
    useGameStore();
  const attackUnit = useGameStore((state) => state.attackUnit);
  const endPlayerTurn = useGameStore((state) => state.endPlayerTurn);

  const selectedUnit = units.find((u) => u.id === selectedUnitId);

  if (!selectedUnit) {
    return (
      <div className="unit-panel">
        <h3 className="panel-title">单位信息</h3>
        <div className="no-selection">请选择一个单位</div>
      </div>
    );
  }

  const canAttack = !selectedUnit.hasAttacked && attackableTargets.length > 0;
  const canEndTurn = gamePhase === 'player-turn' && currentTurn === 'player';

  return (
    <div className="unit-panel">
      <h3 className="panel-title">单位信息</h3>
      <div className="unit-info">
        <div
          className="unit-avatar"
          style={{ backgroundColor: selectedUnit.team === 'player' ? '#3498db' : '#e74c3c' }}
        >
          <span className="unit-letter">{selectedUnit.type[0].toUpperCase()}</span>
        </div>
        <div className="unit-details">
          <div className="unit-name">{selectedUnit.name}</div>
          <div className="unit-type">类型: {selectedUnit.type}</div>
        </div>
      </div>

      <div className="stats-container">
        <div className="stat-row">
          <span className="stat-label">生命值</span>
          <div className="hp-bar-container">
            <div
              className="hp-bar-fill"
              style={{
                width: `${(selectedUnit.hp / selectedUnit.maxHp) * 100}%`,
                backgroundColor:
                  selectedUnit.hp / selectedUnit.maxHp > 0.5
                    ? '#2ecc71'
                    : selectedUnit.hp / selectedUnit.maxHp > 0.25
                    ? '#f1c40f'
                    : '#e74c3c',
              }}
            />
          </div>
          <span className="stat-value">
            {selectedUnit.hp}/{selectedUnit.maxHp}
          </span>
        </div>

        <div className="stat-row">
          <span className="stat-label">攻击力</span>
          <span className="stat-value attack">{selectedUnit.attack}</span>
        </div>

        <div className="stat-row">
          <span className="stat-label">移动力</span>
          <span className="stat-value move">{selectedUnit.moveRange}</span>
        </div>

        <div className="stat-row">
          <span className="stat-label">攻击范围</span>
          <span className="stat-value range">{selectedUnit.attackRange}</span>
        </div>
      </div>

      <div className="action-status">
        <div className={`status-item ${selectedUnit.hasMoved ? 'done' : 'available'}`}>
          {selectedUnit.hasMoved ? '✓ 已移动' : '○ 可移动'}
        </div>
        <div className={`status-item ${selectedUnit.hasAttacked ? 'done' : 'available'}`}>
          {selectedUnit.hasAttacked ? '✓ 已攻击' : '○ 可攻击'}
        </div>
      </div>

      {canAttack && (
        <div className="attack-targets">
          <h4>可攻击目标</h4>
          {attackableTargets.map((target) => (
            <button
              key={target.id}
              className="attack-btn"
              onClick={() => attackUnit(selectedUnitId!, target.id)}
            >
              攻击 {target.name}
            </button>
          ))}
        </div>
      )}

      {canEndTurn && (
        <button className="end-turn-btn" onClick={endPlayerTurn}>
          结束回合
        </button>
      )}
    </div>
  );
};

export default UnitPanel;
