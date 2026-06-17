import { v4 as uuidv4 } from 'uuid';
import type { Card } from '../types';

export interface CardTemplate {
  name: string;
  type: 'attack' | 'defense' | 'special';
  cost: number;
  value: number;
  effect?: 'draw' | 'discard';
  description: string;
}

const CARD_TEMPLATES: CardTemplate[] = [
  { name: '烈焰斩', type: 'attack', cost: 1, value: 4, description: '造成4点伤害' },
  { name: '雷霆一击', type: 'attack', cost: 2, value: 7, description: '造成7点伤害' },
  { name: '暗影刺杀', type: 'attack', cost: 3, value: 10, description: '造成10点伤害' },
  { name: '毁灭打击', type: 'attack', cost: 4, value: 14, description: '造成14点伤害' },
  { name: '末日审判', type: 'attack', cost: 5, value: 20, description: '造成20点伤害' },
  { name: '铁壁', type: 'defense', cost: 1, value: 4, description: '获得4点护甲' },
  { name: '护盾术', type: 'defense', cost: 2, value: 7, description: '获得7点护甲' },
  { name: '圣盾', type: 'defense', cost: 3, value: 11, description: '获得11点护甲' },
  { name: '魔法屏障', type: 'defense', cost: 4, value: 15, description: '获得15点护甲' },
  { name: '智慧之眼', type: 'special', cost: 1, value: 2, effect: 'draw', description: '抽2张牌' },
  { name: '命运转轮', type: 'special', cost: 2, value: 3, effect: 'draw', description: '抽3张牌' },
  { name: '混乱风暴', type: 'special', cost: 2, value: 2, effect: 'discard', description: '对手弃2张牌' },
  { name: '灵魂抽取', type: 'special', cost: 3, value: 3, effect: 'discard', description: '对手弃3张牌' },
];

export function createCard(template: CardTemplate): Card {
  return {
    id: uuidv4(),
    ...template,
  };
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  CARD_TEMPLATES.forEach((template) => {
    const copies = template.cost <= 2 ? 3 : 2;
    for (let i = 0; i < copies; i++) {
      deck.push(createCard(template));
    }
  });
  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const MAX_HAND_SIZE = 7;
export const MAX_ENERGY = 5;
export const TURN_DURATION = 30;
export const MAX_HEALTH = 30;
