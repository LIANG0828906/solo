export type CardTag = '火焰' | '冰霜' | '暗影' | '物理';

export interface Card {
  id: string;
  name: string;
  cost: 1 | 2 | 3;
  attack: number;
  description: string;
  tag: CardTag;
}

export interface Player {
  hp: number;
  maxHp: number;
  gold: number;
  hand: Card[];
  deck: Card[];
}

export interface Enemy {
  hp: number;
  maxHp: number;
  attack: number;
  name: string;
}

export interface ComboChain {
  tag: CardTag | null;
  count: number;
}

export type GamePhase = 'draw' | 'play' | 'enemy' | 'ended';

export interface GameState {
  player: Player;
  enemy: Enemy;
  turn: number;
  phase: GamePhase;
  cardsPlayedThisTurn: number;
  comboChain: ComboChain;
  cardPool: Card[];
  gameResult: 'win' | 'lose' | null;
  placedCards: Card[];
}

export interface DamagePopup {
  id: string;
  value: number;
  x: number;
  y: number;
  isPlayer: boolean;
}

export interface FlyingCard {
  card: Card;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
}

export const TAG_COLORS: Record<CardTag, { primary: string; glow: string; particle: string }> = {
  '火焰': { primary: '#ef4444', glow: 'rgba(239, 68, 68, 0.6)', particle: '#f97316' },
  '冰霜': { primary: '#3b82f6', glow: 'rgba(59, 130, 246, 0.6)', particle: '#60a5fa' },
  '暗影': { primary: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.6)', particle: '#a78bfa' },
  '物理': { primary: '#6b7280', glow: 'rgba(107, 114, 128, 0.6)', particle: '#9ca3af' },
};

export const COST_GRADIENTS: Record<1 | 2 | 3, string> = {
  1: 'linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%)',
  2: 'linear-gradient(135deg, #ba68c8 0%, #9c27b0 100%)',
  3: 'linear-gradient(135deg, #ffd54f 0%, #ffb300 100%)',
};
