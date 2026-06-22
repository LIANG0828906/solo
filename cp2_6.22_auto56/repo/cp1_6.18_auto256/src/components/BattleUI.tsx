import { useState } from 'react';
import { useGameStore } from '../gameStore';
import type { SkillType } from '../types';
import './BattleUI.css';

interface SkillButtonProps {
  type: SkillType;
  label: string;
  description: string;
  disabled?: boolean;
  onClick: () => void;
}

function SkillButton({ label, description, disabled, onClick }: SkillButtonProps) {
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    if (disabled || animating) return;
    setAnimating(true);
    onClick();
    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <button
      className={`skill-button ${animating ? 'animating' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={handleClick}
      disabled={disabled}
    >
      <span className="skill-label">{label}</span>
      <span className="skill-desc">{description}</span>
    </button>
  );
}

export function BattleUI() {
  const { player, battle, useSkill } = useGameStore();

  if (!battle.active || !battle.monster) return null;

  const monster = battle.monster;
  const playerHpPercent = (player.hp / player.maxHp) * 100;
  const playerEnergyPercent = (player.energy / player.maxEnergy) * 100;
  const monsterHpPercent = (monster.hp / monster.maxHp) * 100;
  const isPlayerTurn = battle.playerTurn;

  return (
    <div className="battle-overlay">
      <div className="battle-container">
        <div className="battle-header">
          <div className="player-stats">
            <div className="stat-label">玩家</div>
            <div className="hp-bar">
              <div
                className="hp-bar-fill player-hp"
                style={{ width: `${playerHpPercent}%` }}
              />
              <span className="hp-text">{player.hp}/{player.maxHp}</span>
            </div>
            <div className="energy-bar">
              <div
                className="energy-bar-fill"
                style={{ width: `${playerEnergyPercent}%` }}
              />
              <span className="energy-text">能量 {player.energy}/{player.maxEnergy}</span>
            </div>
          </div>

          <div className="battle-versus">⚔️</div>

          <div className="monster-stats">
            <div className="stat-label">{monster.name}</div>
            <div className={`hp-bar ${monster.isHit ? 'monster-hit' : ''}`}>
              <div
                className="hp-bar-fill monster-hp"
                style={{ width: `${monsterHpPercent}%` }}
              />
              <span className="hp-text">{monster.hp}/{monster.maxHp}</span>
            </div>
            <div className="monster-icon-big">
              <span className={`monster-emoji ${monster.isHit ? 'shake' : ''}`}>👹</span>
            </div>
          </div>
        </div>

        <div className="battle-log">
          {battle.log.slice(-3).map((msg, i) => (
            <div key={i} className="log-message">{msg}</div>
          ))}
        </div>

        <div className="battle-skills">
          <SkillButton
            type="attack"
            label="普通攻击"
            description="10-15伤害"
            disabled={!isPlayerTurn}
            onClick={() => useSkill('attack')}
          />
          <SkillButton
            type="defend"
            label="防御"
            description="减伤50%"
            disabled={!isPlayerTurn}
            onClick={() => useSkill('defend')}
          />
          <SkillButton
            type="special"
            label="特殊技"
            description="25-30伤害/耗30能量"
            disabled={!isPlayerTurn || player.energy < 30}
            onClick={() => useSkill('special')}
          />
        </div>

        <div className="turn-indicator">
          {isPlayerTurn ? '轮到你行动！' : `${monster.name}正在行动...`}
        </div>
      </div>
    </div>
  );
}
