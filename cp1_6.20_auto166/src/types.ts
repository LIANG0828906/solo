export type CardType = 'minion' | 'spell';
export type CardEffect = 'taunt' | 'charge' | 'none';
export type SpellEffect = 'damage' | 'heal' | 'buff' | 'draw';

export interface Card {
  id: string;
  instanceId?: string;
  name: string;
  cost: number;
  type: CardType;
  attack?: number;
  health?: number;
  maxHealth?: number;
  effect?: CardEffect;
  spellEffect?: SpellEffect;
  spellValue?: number;
  description: string;
  canAttack?: boolean;
  hasAttacked?: boolean;
}

export interface Player {
  id: 'player' | 'ai';
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  deck: Card[];
  hand: Card[];
  board: Card[];
}

export interface BattleLogEntry {
  turn: number;
  actor: 'player' | 'ai';
  action: string;
  detail: string;
  timestamp: number;
}

export interface GameState {
  gameId: string;
  turn: number;
  currentPlayer: 'player' | 'ai';
  player: Player;
  ai: Player;
  battleLogs: BattleLogEntry[];
  gameOver: boolean;
  winner: 'player' | 'ai' | null;
  stats: {
    totalTurns: number;
    playerCardsPlayed: number;
    aiCardsPlayed: number;
    totalDamage: number;
  };
}

export interface AIAction {
  type: 'playCard' | 'attack' | 'endTurn';
  cardInstanceId?: string;
  targetId?: string;
  targetType?: 'minion' | 'hero';
}
