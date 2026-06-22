import type { Unit, SkillEffect } from '../types';

export interface DamageResult {
  damage: number;
  isCrit: boolean;
  baseDamage: number;
}

export function calculateDamage(
  attacker: Unit,
  defender: Unit,
  skillEffect?: SkillEffect
): DamageResult {
  const baseAttack = attacker.attack;

  let defense = defender.defense;
  if (skillEffect?.ignoreDefensePercent) {
    defense = defense * (1 - skillEffect.ignoreDefensePercent);
  }

  const defenseFactor = 1 - defense / (defense + 100);
  const randomFactor = 0.9 + Math.random() * 0.2;

  let damage = baseAttack * defenseFactor * randomFactor;

  if (skillEffect?.damageMultiplier) {
    damage *= skillEffect.damageMultiplier;
  }

  const isCrit = Math.random() < 0.1;
  if (isCrit) {
    damage *= 1.5;
  }

  damage = Math.max(1, Math.floor(damage));

  return {
    damage,
    isCrit,
    baseDamage: Math.floor(baseAttack * defenseFactor),
  };
}

export function calculateSplashDamage(
  attacker: Unit,
  defender: Unit,
  splashPercent: number,
  skillEffect?: SkillEffect
): DamageResult {
  const result = calculateDamage(attacker, defender, skillEffect);
  return {
    ...result,
    damage: Math.max(1, Math.floor(result.damage * splashPercent)),
  };
}
