import React, { useEffect, useRef } from 'react';
import type { Unit, Faction, GameState } from '../types';
import { getClassName, getFactionName, getSkill, getClassAbbr } from '../battle/BattleSystem';

interface UnitPanelProps {
  gameState: GameState;
  selectedUnit: Unit | null;
  currentUnitId: string | null;
  onSkillSelect: (skillId: string | null) => void;
  selectedSkillId: string | null;
  onSkipTurn: () => void;
  onUnitClick: (unit: Unit) => void;
}

const UnitPanel: React.FC<UnitPanelProps> = ({
  gameState,
  selectedUnit,
  currentUnitId,
  onSkillSelect,
  selectedSkillId,
  onSkipTurn,
  onUnitClick,
}) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [gameState.logs]);

  const currentFaction: Faction = gameState.currentFaction;
  const factionUnits = gameState.units.filter(u => u.faction === currentFaction && u.hp > 0);
  const actedUnits = factionUnits.filter(u => u.hasMoved && u.hasAttacked);
  const pendingUnits = factionUnits.filter(u => !(u.hasMoved && u.hasAttacked));

  const blueAlive = gameState.units.filter(u => u.faction === 'blue' && u.hp > 0);
  const redAlive = gameState.units.filter(u => u.faction === 'red' && u.hp > 0);

  const renderFactionUnitList = (faction: Faction, units: Unit[]) => {
    return (
      <div className={`faction-unit-list ${faction}`}>
        <div className="faction-list-header">
          <span className={`faction-badge ${faction}`}>{getFactionName(faction)}</span>
          <span className="faction-count">{units.length}/3</span>
        </div>
        <div className="faction-units">
          {units.length === 0 ? (
            <div className="no-units">全灭</div>
          ) : (
            units.map(unit => (
              <div
                key={unit.id}
                className={`mini-unit-card ${unit.id === currentUnitId ? 'active' : ''} ${unit.id === selectedUnit?.id ? 'selected' : ''} ${unit.hasMoved && unit.hasAttacked ? 'done' : ''}`}
                onClick={() => onUnitClick(unit)}
              >
                <span className={`mini-class-icon ${unit.unitClass}`}>
                  {getClassAbbr(unit.unitClass)}
                </span>
                <div className="mini-unit-info">
                  <div className="mini-unit-name">{unit.name}</div>
                  <div className="mini-unit-hp-bar">
                    <div
                      className="mini-hp-fill"
                      style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }}
                    />
                  </div>
                </div>
                {(unit.hasMoved || unit.hasAttacked) && (
                  <div className="mini-unit-status">
                    {unit.hasMoved && <span title="已移动">移</span>}
                    {unit.hasAttacked && <span title="已攻击">攻</span>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="unit-panel">
      <h3 className="panel-title">战斗面板</h3>

      <div className="turn-status-card">
        <div className="turn-status-header">
          <span className="turn-badge">第 {gameState.currentTurn} 回合</span>
          <span className={`turn-faction ${currentFaction}`}>
            {getFactionName(currentFaction)}行动中
          </span>
        </div>
        <div className="turn-progress">
          <div className="progress-label">
            已行动 {actedUnits.length} / {factionUnits.length}
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(actedUnits.length / Math.max(1, factionUnits.length)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="faction-status-section">
        <div className="faction-compare">
          <div className={`faction-card blue ${currentFaction === 'blue' ? 'active' : ''}`}>
            <div className="faction-icon">🔵</div>
            <div className="faction-stats">
              <div className="faction-name">蓝方</div>
              <div className="faction-stats-num">存活: {blueAlive.length}</div>
            </div>
          </div>
          <div className="vs-divider">VS</div>
          <div className={`faction-card red ${currentFaction === 'red' ? 'active' : ''}`}>
            <div className="faction-icon">🔴</div>
            <div className="faction-stats">
              <div className="faction-name">红方</div>
              <div className="faction-stats-num">存活: {redAlive.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="action-status-section">
        <h4 className="section-subtitle">本回合状态</h4>
        <div className="action-tabs">
          <div className="action-tab pending">
            <span className="tab-title">待行动 ({pendingUnits.length})</span>
            {pendingUnits.slice(0, 3).map(u => (
              <span key={u.id} className={`tab-tag ${u.unitClass} ${u.id === currentUnitId ? 'current' : ''}`}>
                {getClassAbbr(u.unitClass)}
              </span>
            ))}
          </div>
          <div className="action-tab done">
            <span className="tab-title">已完成 ({actedUnits.length})</span>
            {actedUnits.slice(0, 3).map(u => (
              <span key={u.id} className={`tab-tag ${u.unitClass} done`}>
                {getClassAbbr(u.unitClass)}✓
              </span>
            ))}
          </div>
        </div>
      </div>

      {renderFactionUnitList(currentFaction, factionUnits)}

      {selectedUnit && (
        <div className="selected-unit-detail">
          <h4 className="section-subtitle">选中单位</h4>

          <div className="unit-header">
            <div className={`unit-avatar ${selectedUnit.faction}`}>
              <span className="avatar-text">{getClassName(selectedUnit.unitClass)}</span>
            </div>
            <div className="unit-basic-info">
              <div className="unit-name">{selectedUnit.name}</div>
              <div className={`unit-faction ${selectedUnit.faction}`}>
                {getFactionName(selectedUnit.faction)}
              </div>
            </div>
          </div>

          <div className="stats-section">
            <div className="stat-row">
              <span className="stat-label">生命值</span>
              <div className="stat-bar-container">
                <div
                  className="stat-bar hp-bar"
                  style={{
                    width: `${(selectedUnit.hp / selectedUnit.maxHp) * 100}%`,
                  }}
                />
                <span className="stat-value">
                  {selectedUnit.hp} / {selectedUnit.maxHp}
                </span>
              </div>
            </div>

            <div className="stat-row">
              <span className="stat-label">能量</span>
              <div className="stat-bar-container">
                <div
                  className="stat-bar energy-bar"
                  style={{
                    width: `${(selectedUnit.energy / selectedUnit.maxEnergy) * 100}%`,
                  }}
                />
                <span className="stat-value">
                  {selectedUnit.energy} / {selectedUnit.maxEnergy}
                </span>
              </div>
            </div>

            <div className="stat-grid">
              <div className="stat-item">
                <span className="stat-icon">⚔</span>
                <span className="stat-name">攻击</span>
                <span className="stat-number">{selectedUnit.attack}</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🛡</span>
                <span className="stat-name">防御</span>
                <span className="stat-number">{selectedUnit.defense}</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">👟</span>
                <span className="stat-name">移动</span>
                <span className="stat-number">{selectedUnit.moveRange}</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🎯</span>
                <span className="stat-name">射程</span>
                <span className="stat-number">{selectedUnit.attackRange}</span>
              </div>
            </div>
          </div>

          <div className="status-section">
            <div className="status-row">
              <span>移动状态</span>
              <span className={selectedUnit.hasMoved ? 'status-done' : 'status-ready'}>
                {selectedUnit.hasMoved ? '已移动' : '可移动'}
              </span>
            </div>
            <div className="status-row">
              <span>攻击状态</span>
              <span className={selectedUnit.hasAttacked ? 'status-done' : 'status-ready'}>
                {selectedUnit.hasAttacked ? '已攻击' : '可攻击'}
              </span>
            </div>
            {selectedUnit.skillCooldown > 0 && (
              <div className="status-row">
                <span>技能冷却</span>
                <span className="status-cooldown">{selectedUnit.skillCooldown} 回合</span>
              </div>
            )}
          </div>

          <div className="skills-section">
            <h4 className="section-subtitle">技能</h4>
            {(() => {
              const skill = getSkill(selectedUnit.unitClass);
              const isCurrentUnit = selectedUnit.id === currentUnitId;
              const canUseSkill = isCurrentUnit &&
                !selectedUnit.hasAttacked &&
                selectedUnit.skillCooldown === 0 &&
                selectedUnit.energy >= skill.energyCost &&
                (gameState.phase === 'selecting_attack' || gameState.phase === 'selecting_skill_target');
              const isSkillSelected = selectedSkillId === skill.id;

              return (
                <button
                  className={`skill-button ${isSkillSelected ? 'selected' : ''} ${!canUseSkill ? 'disabled' : ''}`}
                  onClick={() => canUseSkill && onSkillSelect(isSkillSelected ? null : skill.id)}
                  disabled={!canUseSkill}
                >
                  <div className="skill-header">
                    <span className="skill-name">{skill.name}</span>
                    <span className="skill-cost">消耗 {skill.energyCost} 能量</span>
                  </div>
                  <div className="skill-desc">{skill.description}</div>
                  {selectedUnit.skillCooldown > 0 && (
                    <div className="skill-cooldown">冷却: {selectedUnit.skillCooldown} 回合</div>
                  )}
                  {selectedUnit.energy < skill.energyCost && selectedUnit.skillCooldown === 0 && (
                    <div className="skill-cooldown">能量不足</div>
                  )}
                </button>
              );
            })()}
          </div>

          {selectedUnit.id === currentUnitId && (gameState.phase === 'selecting_move' || gameState.phase === 'selecting_attack') && (
            <button className="skip-button" onClick={onSkipTurn}>
              待命 / 跳过本单位
            </button>
          )}
        </div>
      )}

      {!selectedUnit && gameState.phase !== 'idle' && (
        <div className="empty-panel">
          <p>点击单位查看详情</p>
          <p className="hint-text">或选择当前行动单位</p>
        </div>
      )}

      {gameState.phase !== 'idle' && (
        <div className="battle-log-mini">
          <h4 className="section-subtitle">战斗日志</h4>
          <div className="log-container mini" ref={logContainerRef}>
            {gameState.logs.length === 0 ? (
              <div className="empty-log">暂无记录</div>
            ) : (
              gameState.logs.map((log, index) => (
                <div
                  key={log.id}
                  className={`log-entry ${index === gameState.logs.length - 1 ? 'latest' : ''}`}
                >
                  <span className="log-turn">[{log.turn}]</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitPanel;
