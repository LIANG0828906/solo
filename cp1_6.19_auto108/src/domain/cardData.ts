export type SkillType = 'extra_damage' | 'heal' | 'attack_halve' | 'draw' | 'double_attack';

export interface Skill {
  id: string;
  name: string;
  description: (value: number) => string;
  iconKey: string;
  type: SkillType;
}

export interface Card {
  id: string;
  name: string;
  cost: number;
  attack: number;
  defense: number;
  skillId: string | null;
  skillValue: number;
}

export type Deck = Card[];

export interface DeckStats {
  avgAttack: number;
  avgDefense: number;
  totalCost: number;
}

export const SKILLS: Skill[] = [
  {
    id: 'skill_extra_damage',
    name: '重击',
    description: (v) => `造成额外${v}点伤害`,
    iconKey: 'FaBolt',
    type: 'extra_damage',
  },
  {
    id: 'skill_heal',
    name: '治疗',
    description: (v) => `回复${v}点生命`,
    iconKey: 'FaHeart',
    type: 'heal',
  },
  {
    id: 'skill_attack_halve',
    name: '虚弱',
    description: (v) => `使对方下回合攻击减半(${v}回合)`,
    iconKey: 'FaArrowDown',
    type: 'attack_halve',
  },
  {
    id: 'skill_draw',
    name: '抽牌',
    description: (v) => `抽${v}张牌`,
    iconKey: 'FaClone',
    type: 'draw',
  },
  {
    id: 'skill_double_attack',
    name: '狂暴',
    description: (v) => `本回合攻击力翻倍(+${v}%)`,
    iconKey: 'FaFire',
    type: 'double_attack',
  },
];

export function getSkillById(id: string | null): Skill | null {
  if (!id) return null;
  return SKILLS.find((s) => s.id === id) ?? null;
}

let cardIdCounter = 0;
export function generateCardId(): string {
  cardIdCounter += 1;
  return `card_${Date.now()}_${cardIdCounter}`;
}

export const DEFAULT_CARD_LIBRARY: Card[] = [
  { id: generateCardId(), name: '新兵', cost: 1, attack: 2, defense: 1, skillId: null, skillValue: 1 },
  { id: generateCardId(), name: '战士', cost: 3, attack: 4, defense: 3, skillId: null, skillValue: 1 },
  { id: generateCardId(), name: '骑士', cost: 5, attack: 5, defense: 6, skillId: null, skillValue: 1 },
  { id: generateCardId(), name: '法师', cost: 4, attack: 6, defense: 2, skillId: 'skill_extra_damage', skillValue: 3 },
  { id: generateCardId(), name: '牧师', cost: 3, attack: 1, defense: 3, skillId: 'skill_heal', skillValue: 4 },
  { id: generateCardId(), name: '刺客', cost: 2, attack: 4, defense: 1, skillId: 'skill_double_attack', skillValue: 5 },
  { id: generateCardId(), name: '巫师', cost: 5, attack: 3, defense: 3, skillId: 'skill_attack_halve', skillValue: 2 },
  { id: generateCardId(), name: '学者', cost: 2, attack: 1, defense: 2, skillId: 'skill_draw', skillValue: 2 },
  { id: generateCardId(), name: '巨像', cost: 7, attack: 8, defense: 8, skillId: null, skillValue: 1 },
  { id: generateCardId(), name: '游侠', cost: 3, attack: 3, defense: 2, skillId: 'skill_extra_damage', skillValue: 2 },
  { id: generateCardId(), name: '圣骑士', cost: 6, attack: 4, defense: 5, skillId: 'skill_heal', skillValue: 3 },
  { id: generateCardId(), name: '狂战士', cost: 4, attack: 7, defense: 1, skillId: 'skill_double_attack', skillValue: 3 },
];

export function cloneCard(card: Card): Card {
  return { ...card, id: generateCardId() };
}

export function computeDeckStats(deck: Deck): DeckStats {
  if (deck.length === 0) {
    return { avgAttack: 0, avgDefense: 0, totalCost: 0 };
  }
  const totalAttack = deck.reduce((sum, c) => sum + c.attack, 0);
  const totalDefense = deck.reduce((sum, c) => sum + c.defense, 0);
  const totalCost = deck.reduce((sum, c) => sum + c.cost, 0);
  return {
    avgAttack: Number((totalAttack / deck.length).toFixed(1)),
    avgDefense: Number((totalDefense / deck.length).toFixed(1)),
    totalCost,
  };
}
