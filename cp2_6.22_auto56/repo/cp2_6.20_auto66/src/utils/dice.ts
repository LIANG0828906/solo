import type { Attributes, DiceResult } from '../types';

export interface DiceRoll {
  count: number;
  sides: number;
  modifier: number;
}

export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

export function rollD4(): number {
  return Math.floor(Math.random() * 4) + 1;
}

export function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function rollD8(): number {
  return Math.floor(Math.random() * 8) + 1;
}

export function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

export function rollD12(): number {
  return Math.floor(Math.random() * 12) + 1;
}

export function rollDice(count: number, sides: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}

export function rollDiceWithModifier(count: number, sides: number, modifier: number = 0): number {
  return Math.max(1, rollDice(count, sides) + modifier);
}

export function parseDiceNotation(notation: string): DiceRoll {
  const match = notation.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) {
    return { count: 1, sides: 6, modifier: 0 };
  }
  return {
    count: parseInt(match[1], 10),
    sides: parseInt(match[2], 10),
    modifier: match[3] ? parseInt(match[3], 10) : 0,
  };
}

export function rollFromNotation(notation: string): number {
  const { count, sides, modifier } = parseDiceNotation(notation);
  return rollDiceWithModifier(count, sides, modifier);
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

export function getProficiencyBonus(level: number): number {
  return Math.floor((level - 1) / 4) + 2;
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

export interface DamageRoll {
  diceNotation: string;
  diceValue: number;
  modifier: number;
  total: number;
  isCritical: boolean;
}

export function rollDamageFromWeapon(
  diceNotation: string,
  abilityModifier: number,
  isCritical: boolean = false,
  extraDice: number = 0
): DamageRoll {
  const parsed = parseDiceNotation(diceNotation);
  let diceCount = parsed.count + extraDice;

  if (isCritical) {
    diceCount *= 2;
  }

  const diceValue = rollDice(diceCount, parsed.sides);
  const total = Math.max(1, diceValue + abilityModifier + parsed.modifier);

  return {
    diceNotation,
    diceValue,
    modifier: abilityModifier + parsed.modifier,
    total,
    isCritical,
  };
}

export function rollSpellDamage(
  diceNotation: string,
  spellModifier: number,
  isCritical: boolean = false
): DamageRoll {
  const parsed = parseDiceNotation(diceNotation);
  let diceCount = parsed.count;

  if (isCritical) {
    diceCount *= 2;
  }

  const diceValue = rollDice(diceCount, parsed.sides);
  const total = Math.max(1, diceValue + spellModifier);

  return {
    diceNotation,
    diceValue,
    modifier: spellModifier,
    total,
    isCritical,
  };
}
