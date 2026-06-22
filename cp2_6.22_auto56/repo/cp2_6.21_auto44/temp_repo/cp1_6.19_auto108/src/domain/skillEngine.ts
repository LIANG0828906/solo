import { Card, getSkillById } from './cardData';

export interface SkillEffectResult {
  extraDamage: number;
  healAmount: number;
  attackHalveTurns: number;
  drawCards: number;
  doubleAttackPercent: number;
}

export function createEmptyEffect(): SkillEffectResult {
  return {
    extraDamage: 0,
    healAmount: 0,
    attackHalveTurns: 0,
    drawCards: 0,
    doubleAttackPercent: 0,
  };
}

export function resolveCardSkill(card: Card): SkillEffectResult {
  const effect = createEmptyEffect();
  const skill = getSkillById(card.skillId);
  if (!skill) return effect;
  const value = Math.max(1, Math.min(10, card.skillValue));

  switch (skill.type) {
    case 'extra_damage':
      effect.extraDamage = value;
      break;
    case 'heal':
      effect.healAmount = value;
      break;
    case 'attack_halve':
      effect.attackHalveTurns = value;
      break;
    case 'draw':
      effect.drawCards = value;
      break;
    case 'double_attack':
      effect.doubleAttackPercent = value;
      break;
  }
  return effect;
}
