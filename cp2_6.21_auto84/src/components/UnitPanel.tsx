import React from 'react';
import type { Unit } from '../types';
import { getClassName, getFactionName, getSkill } from '../battle/BattleSystem';

interface UnitPanelProps {
  selectedUnit: Unit | null;
  currentUnitId: string | null;
  onSkillSelect: (skillId: string | null) => void;
  selectedSkillId: string | null;
  onSkipTurn: () => void;
  phase: string;
}

const UnitPanel: React.FC<UnitPanelProps> = ({
  selectedUnit,
  currentUnitId,
  onSkillSelect,
  selectedSkillId,
  onSkipTurn,
  phase,
}) => {
  if (!selectedUnit) {
    return (
      <div className="unit-panel">
        <h3 className="panel-title">单位信息</h3>
        <div className="empty-panel">
          <p>点击单位查看详情</p>
        </div>
      </div>
    );
  }

  const skill = getSkill(selectedUnit.unitClass);
  const isCurrentUnit = selectedUnit.id === currentUnitId;
  const canUseSkill = isCurrentUnit &&
    !selectedUnit.hasAttacked &&
    selectedUnit.skillCooldown === 0 &&
    selectedUnit.energy >= skill.energyCost &&
    (phase === 'selecting_attack' || phase === 'selecting_skill_target');

  const isSkillSelected = selectedSkillId === skill.id;

  return (
    <div className="unit-panel">
      <h3 className="panel-title">单位信息</h3>

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
      </div>

      <div className="skills-section">
        <h4 className="section-subtitle">技能</h4>
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
        </button>
      </div>

      {isCurrentUnit && (phase === 'selecting_move' || phase === 'selecting_attack') && (
        <button className="skip-button" onClick={onSkipTurn}>
          待命 / 跳过
        </button>
      )}
    </div>
  );
};

export default UnitPanel;
