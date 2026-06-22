import ParticleEffect from './ParticleEffect';
import type { ParticleType } from './ParticleEffect';
import type { Enemy, SpellEffect, StatusEffect } from './types';
import './BattleScene.css';

interface BattleSceneProps {
  enemies: Enemy[];
  isCasting: boolean;
  damageNumbers: Array<{ id: string; value: number; targetId: string }>;
  currentSpell: SpellEffect | null;
}

const STATUS_ICONS: Record<StatusEffect['type'], string> = {
  slow: '🐌',
  burn: '🔥',
  stun: '💫',
  heal: '💚',
  shield: '🛡️',
  poison: '☠️',
  cleanse: '✨',
};

function getParticleType(spell: SpellEffect | null): ParticleType {
  if (!spell) return 'none';
  const typeMap: Record<string, ParticleType> = {
    flame: 'flame',
    frost: 'frost',
    storm: 'storm',
    chaos: 'chaos',
    purify: 'purify',
    divine: 'divine',
    corrosion: 'corrosion',
    rock: 'rock',
    rift: 'rift',
    fire: 'fire',
    ice: 'ice',
    thunder: 'thunder',
    shadow: 'shadow',
    wind: 'wind',
    ghost: 'ghost',
    light: 'light',
    poison: 'poison',
    time: 'time',
    guard: 'fire',
    heal: 'fire',
  };
  return typeMap[spell.particleType] || typeMap[spell.element] || 'fire';
}

function getEnemyAvatar(attackType: string): string {
  const avatars: Record<string, string> = {
    近战: '👹',
    远程: '🧙',
    法术: '🧝',
    毒素: '🕷️',
    雷电: '⚡',
    火焰: '🔥',
    冰霜: '❄️',
  };
  return avatars[attackType] || '👹';
}

export function BattleScene({ enemies, isCasting, damageNumbers, currentSpell }: BattleSceneProps) {
  const particleType = getParticleType(currentSpell);
  const isAoe = currentSpell?.type === 'aoe';

  return (
    <div className="battle-scene-container">
      <div className="battle-platform">
        <div className="platform-surface" />
        <div className="platform-glow" />

        {enemies.map((enemy, index) => (
          <div
            key={enemy.id}
            className={`enemy-unit ${isCasting && (isAoe || index === 0) ? 'hit' : ''} ${
              enemy.currentHp <= 0 ? 'defeated' : ''
            }`}
            style={{ '--enemy-index': index } as React.CSSProperties}
          >
            <div className="enemy-status-icons">
              {enemy.statusEffects.slice(0, 4).map((effect, i) => (
                <div key={i} className={`status-icon status-${effect.type}`} title={effect.type}>
                  <span className="status-icon-text">{STATUS_ICONS[effect.type]}</span>
                  <span className="status-duration">{effect.duration}</span>
                </div>
              ))}
            </div>

            <div className="enemy-hp-bar-top">
              <div
                className="enemy-hp-fill-top"
                style={{ width: `${(enemy.currentHp / enemy.maxHp) * 100}%` }}
              />
            </div>

            <div className="enemy-avatar-wrapper">
              <div className="enemy-avatar-glow" />
              <div className="enemy-avatar">{getEnemyAvatar(enemy.attackType)}</div>
              <ParticleEffect type={particleType} active={isCasting && (isAoe || index === 0)} />
            </div>

            <div className="enemy-name-tag">{enemy.name}</div>

            {damageNumbers
              .filter((d) => d.targetId === enemy.id)
              .map((dmg) => (
                <div key={dmg.id} className="damage-number">
                  -{dmg.value}
                </div>
              ))}
          </div>
        ))}
      </div>

      <div className="battle-foreground" />
      <div className="battle-particles-bg" />
    </div>
  );
}

export default BattleScene;
