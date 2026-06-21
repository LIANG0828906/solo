import type { UnitType, UnitPreset, UnitSkill } from '../types';

export const UNIT_PRESETS: Record<UnitType, UnitPreset> = {
  warrior: {
    type: 'warrior',
    name: '战士',
    attack: 25,
    health: 120,
    maxHealth: 120,
    skillCooldown: 3,
  },
  mage: {
    type: 'mage',
    name: '法师',
    attack: 40,
    health: 70,
    maxHealth: 70,
    skillCooldown: 2,
  },
  archer: {
    type: 'archer',
    name: '射手',
    attack: 30,
    health: 90,
    maxHealth: 90,
    skillCooldown: 2,
  },
};

export const UNIT_SKILLS: Record<UnitType, UnitSkill> = {
  warrior: {
    name: '重击',
    description: '造成1.8倍伤害',
    damageMultiplier: 1.8,
  },
  mage: {
    name: '火球术',
    description: '造成2.2倍伤害',
    damageMultiplier: 2.2,
  },
  archer: {
    name: '连射',
    description: '攻击两次，每次0.8倍伤害',
    damageMultiplier: 0.8,
  },
};

export const UNIT_ICONS: Record<UnitType, string> = {
  warrior: '⚔️',
  mage: '🔮',
  archer: '🏹',
};

export const UNIT_COLORS: Record<UnitType, string> = {
  warrior: '#e74c3c',
  mage: '#9b59b6',
  archer: '#27ae60',
};

export const ALL_UNIT_TYPES: UnitType[] = ['warrior', 'mage', 'archer'];
