import type { Attributes, DiceResult } from '../types';

export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

export function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function roll4d6DropLowest(): number {
  const rolls = [rollD6(), rollD6(), rollD6(), rollD6()];
  rolls.sort((a, b) => a - b);
  return rolls[1] + rolls[2] + rolls[3];
}

export function rollAllAttributes(): Attributes {
  return {
    strength: roll4d6DropLowest(),
    dexterity: roll4d6DropLowest(),
    constitution: roll4d6DropLowest(),
    intelligence: roll4d6DropLowest(),
    wisdom: roll4d6DropLowest(),
    charisma: roll4d6DropLowest(),
  };
}

export function getAttributeModifier(attributeValue: number): number {
  return Math.floor((attributeValue - 10) / 2);
}

export function rollCheck(
  attributeValue: number,
  dc: number,
  proficiencyBonus: number = 0
): DiceResult {
  const roll = rollD20();
  const modifier = getAttributeModifier(attributeValue) + proficiencyBonus;
  const total = roll + modifier;
  return {
    value: roll,
    modifier,
    total,
    success: total >= dc,
    dc,
  };
}

export function rollDamage(baseDamage: number, modifier: number = 0): number {
  return Math.max(1, baseDamage + modifier);
}
