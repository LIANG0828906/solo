export type Element = 'fire' | 'water' | 'grass';
export type Team = 'ally' | 'enemy';

export interface Creature {
  id: string;
  name: string;
  element: Element;
  attack: number;
  maxHp: number;
  currentHp: number;
  speed: number;
  team: Team;
  isAlive: boolean;
}

export interface FormationCell {
  id: string;
  creatureId: string | null;
  row: 0 | 1;
  col: 0 | 1 | 2 | 3 | 4;
  position: { x: number; z: number };
}

export type Formation = FormationCell[];

export interface CombatLog {
  round: number;
  attackerId: string;
  targetId: string;
  damage: number;
  elementMultiplier: number;
  isKill: boolean;
  attackerPosition: { x: number; y: number; z: number };
  targetPosition: { x: number; y: number; z: number };
  attackerElement: Element;
}

export interface CombatResult {
  winner: Team | 'draw';
  allySurvivors: number;
  enemySurvivors: number;
  totalDamageAlly: number;
  totalDamageEnemy: number;
  logs: CombatLog[];
  creatures: Map<string, Creature>;
}

export const ELEMENT_MULTIPLIERS: Record<Element, Record<Element, number>> = {
  fire: { fire: 0.5, water: 0.5, grass: 1.5 },
  water: { fire: 1.5, water: 0.5, grass: 0.5 },
  grass: { fire: 0.5, water: 1.5, grass: 0.5 }
};

export const ELEMENT_COLORS: Record<Element, string> = {
  fire: '#ff6b6b',
  water: '#4ecdc4',
  grass: '#95e1a3'
};

export const ELEMENT_ICONS: Record<Element, string> = {
  fire: '🔥',
  water: '💧',
  grass: '🌿'
};

export const CREATURE_NAMES: Record<Element, string[]> = {
  fire: ['炎魔', '火龙', '火精灵', '凤凰', '熔岩巨人', '烈焰狮'],
  water: ['水神', '海龙', '水精灵', '利维坦', '冰霜巨人', '海啸兽'],
  grass: ['树精', '花仙', '草精灵', '世界树', '森林巨人', '藤蔓怪']
};
