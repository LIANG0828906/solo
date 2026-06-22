export type EffectType = 'attack' | 'defense' | 'draw' | 'heal';
export type Rarity = 'common' | 'rare' | 'epic';

export interface CardEffect {
  id: string;
  name: string;
  type: EffectType;
  value: number;
  baseCost: number;
  description: string;
}

export interface Card {
  id: string;
  name: string;
  rarity: Rarity;
  effects: CardEffect[];
  cost: number;
  power: number;
  isDraft?: boolean;
}

export interface BattleLog {
  turn: number;
  message: string;
}

export interface BattleResult {
  logs: BattleLog[];
  winner: 'player' | 'ai' | 'draw';
}

export const EFFECT_TYPE_LABELS: Record<EffectType, string> = {
  attack: '攻击',
  defense: '防御',
  draw: '抽牌',
  heal: '回复',
};

export const RARITY_LABELS: Record<Rarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
};

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#4a4a6a',
  rare: '#4a90d9',
  epic: '#9b59b6',
};

export const EFFECT_TYPE_COLORS: Record<EffectType, string> = {
  attack: '#e74c3c',
  defense: '#3498db',
  draw: '#f39c12',
  heal: '#2ecc71',
};
