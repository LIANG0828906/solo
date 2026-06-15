export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Card {
  id: string;
  name: string;
  rarity: Rarity;
  cost: number;
  attack: number;
  health: number;
  borderId: string;
  iconId: string;
  description: string;
}

export interface BorderPreset {
  id: string;
  name: string;
  pattern: string | null;
}

export interface IconPreset {
  id: string;
  name: string;
  svg: string;
}

export interface CardValidationResult {
  valid: boolean;
  errors: string[];
}

export interface DeckValidationResult {
  valid: boolean;
  errors: string[];
  totalCards: number;
}

export interface Deck {
  id: string;
  name: string;
  cardIds: string[];
}

export interface ManaCurvePoint {
  cost: number;
  count: number;
}

export interface BattleUnit {
  instanceId: string;
  cardId: string;
  currentHealth: number;
  maxHealth: number;
  attack: number;
  canAttack: boolean;
}

export interface PlayerState {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  hand: Card[];
  deck: Card[];
  field: BattleUnit[];
}

export type BattleLogType = 'draw' | 'play' | 'attack' | 'endTurn' | 'damage' | 'death';

export interface BattleLog {
  id: string;
  timestamp: number;
  type: BattleLogType;
  message: string;
}

export interface AttackAction {
  attackerId: string;
  targetId: string;
  targetType: 'minion' | 'hero';
}

export interface AIDecision {
  cardsToPlay: number[];
  attacks: AttackAction[];
  endTurn: boolean;
}

export interface BattleStats {
  player: {
    cardsPlayed: Record<string, number>;
    totalDamage: number;
    manaEfficiency: Record<number, number>;
    deckComposition: Record<string, number>;
  };
  ai: {
    cardsPlayed: Record<string, number>;
    totalDamage: number;
    manaEfficiency: Record<number, number>;
    deckComposition: Record<string, number>;
  };
  turns: number;
  winner: 'player' | 'ai' | null;
}

export type BattlePhase = 'playerTurn' | 'aiTurn' | 'animating' | 'ended';