import React, { memo } from 'react';
import type { Spell } from '@/types';

interface SpellCardProps {
  spell: Spell;
  disabled?: boolean;
  onClick?: () => void;
}

export const SpellCard: React.FC<SpellCardProps> = memo(function SpellCard({
  spell,
  disabled,
  onClick,
}) {
  const isCooldown = spell.currentCooldown > 0;
  const cantUse = isCooldown || disabled;

  return (
    <div
      className={`spell-card ${isCooldown ? 'cooldown' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={() => !cantUse && onClick?.()}
      title={`${spell.name}\n${spell.description}\n伤害: ${spell.baseDamage} | 冷却: ${spell.cooldown}回合`}
    >
      <span className="spell-icon">{spell.icon}</span>
      <span className="spell-card-name">{spell.name}</span>
      <span className="spell-dmg">⚔ {spell.baseDamage}</span>
      {isCooldown && (
        <div className="cooldown-overlay">{spell.currentCooldown}</div>
      )}
    </div>
  );
});
