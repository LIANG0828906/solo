export type ClassType = '战士' | '法师' | '游荡者' | '牧师' | '游侠' | '术士';
export type RaceType = '人类' | '精灵' | '矮人' | '半兽人' | '半身人' | '龙裔';
export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export type SkillKey = string;

export interface Abilities {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface Equipment {
  id: string;
  name: string;
  category: '武器' | '护甲' | '消耗品';
  weight: number;
  damageDice?: string;
  attackBonus?: number;
}

export interface SpellSlot {
  total: number;
  used: number;
}

export interface Skill {
  key: SkillKey;
  name: string;
  ability: AbilityKey;
}

export interface CharacterData {
  name: string;
  classType: ClassType;
  race: RaceType;
  level: number;
  experience: number;
  abilities: Abilities;
  proficientSkills: string[];
  equipment: Equipment[];
  spellSlots: Record<number, SpellSlot>;
  hp: number;
  ac: number;
  speed: number;
}

export const ABILITY_NAMES: Record<AbilityKey, string> = {
  str: '力量',
  dex: '敏捷',
  con: '体质',
  int: '智力',
  wis: '感知',
  cha: '魅力',
};

export const ALL_SKILLS: Skill[] = [
  { key: 'acrobatics', name: '杂技', ability: 'dex' },
  { key: 'animalHandling', name: '驯兽', ability: 'wis' },
  { key: 'arcana', name: '奥秘', ability: 'int' },
  { key: 'athletics', name: '运动', ability: 'str' },
  { key: 'deception', name: '欺瞒', ability: 'cha' },
  { key: 'history', name: '历史', ability: 'int' },
  { key: 'insight', name: '洞悉', ability: 'wis' },
  { key: 'intimidation', name: '威吓', ability: 'cha' },
  { key: 'investigation', name: '调查', ability: 'int' },
  { key: 'medicine', name: '医药', ability: 'wis' },
  { key: 'nature', name: '自然', ability: 'int' },
  { key: 'perception', name: '察觉', ability: 'wis' },
  { key: 'performance', name: '表演', ability: 'cha' },
  { key: 'persuasion', name: '说服', ability: 'cha' },
  { key: 'religion', name: '宗教', ability: 'int' },
  { key: 'sleightOfHand', name: '巧手', ability: 'dex' },
  { key: 'stealth', name: '潜行', ability: 'dex' },
  { key: 'survival', name: '求生', ability: 'wis' },
];

export const CLASS_MAX_SKILLS: Record<ClassType, number> = {
  战士: 2,
  法师: 4,
  游荡者: 7,
  牧师: 2,
  游侠: 3,
  术士: 2,
};

export const CASTER_CLASSES: ClassType[] = ['法师', '术士', '牧师'];

export const RACE_BONUSES: Record<RaceType, Partial<Abilities>> = {
  人类: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
  精灵: { dex: 2, int: 1 },
  矮人: { con: 2, wis: 1 },
  半兽人: { str: 2, con: 1 },
  半身人: { dex: 2, cha: 1 },
  龙裔: { str: 2, cha: 1 },
};

export const CLASS_BONUSES: Record<ClassType, Partial<Abilities>> = {
  战士: { str: 2, con: 1 },
  法师: { int: 2, wis: 1 },
  游荡者: { dex: 2, cha: 1 },
  牧师: { wis: 2, cha: 1 },
  游侠: { dex: 1, wis: 2 },
  术士: { cha: 2, con: 1 },
};

export const SPELL_SLOTS_BY_LEVEL: Record<number, Record<number, number>> = {
  1: { 1: 2 },
  2: { 1: 3 },
  3: { 1: 4, 2: 2 },
  4: { 1: 4, 2: 3 },
  5: { 1: 4, 2: 3, 3: 2 },
  6: { 1: 4, 2: 3, 3: 3 },
  7: { 1: 4, 2: 3, 3: 3, 4: 1 },
  8: { 1: 4, 2: 3, 3: 3, 4: 2 },
  9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
  10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
  11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
  12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
  13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
  14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
  15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
  16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
  17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
  18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
  19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 },
  20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 },
};

export const DICE_REGEX = /^\d+d\d+$/;

export function calcModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function calcProficiencyBonus(level: number): number {
  if (level >= 17) return 6;
  if (level >= 13) return 5;
  if (level >= 9) return 4;
  if (level >= 5) return 3;
  return 2;
}

export function getSpellSlotsForLevel(level: number): Record<number, number> {
  return SPELL_SLOTS_BY_LEVEL[level] || {};
}

export function validateDamageDice(input: string): boolean {
  return DICE_REGEX.test(input);
}
