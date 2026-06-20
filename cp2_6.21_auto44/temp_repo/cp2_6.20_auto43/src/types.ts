export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Card {
  id: string;
  name: string;
  cost: number;
  attack: number;
  health: number;
  skill: string;
  rarity: Rarity;
}

export interface BoardCard extends Card {
  instanceId: string;
  currentHealth: number;
  canAttack: boolean;
  hasAttacked: boolean;
}

export interface Deck {
  id: string;
  name: string;
  cards: Card[];
  createdAt: number;
}

export type GamePhase = 'playerTurn' | 'enemyTurn' | 'ended';

export type BattleResult = 'win' | 'lose' | null;

export interface ActionLog {
  type: 'play' | 'attack' | 'damage' | 'draw' | 'heroAttack';
  actor: 'player' | 'enemy';
  cardName?: string;
  targetName?: string;
  damage?: number;
  timestamp: number;
}

export interface TurnLog {
  turnNumber: number;
  actions: ActionLog[];
  playerHpAfter: number;
  enemyHpAfter: number;
  playerManaAfter: number;
  enemyManaAfter: number;
}

export interface BattleRecord {
  id: string;
  playerDeckName: string;
  enemyDeckName: string;
  result: 'win' | 'lose';
  turns: number;
  duration: number;
  timestamp: number;
  logs: TurnLog[];
}

export interface GameState {
  playerHp: number;
  enemyHp: number;
  playerMaxHp: number;
  enemyMaxHp: number;
  playerMana: number;
  playerMaxMana: number;
  enemyMana: number;
  enemyMaxMana: number;
  playerHand: Card[];
  enemyHand: Card[];
  playerDeck: Card[];
  enemyDeck: Card[];
  playerBoard: BoardCard[];
  enemyBoard: BoardCard[];
  currentTurn: number;
  phase: GamePhase;
  result: BattleResult;
  currentTurnLog: TurnLog;
  allLogs: TurnLog[];
  battleStartTime: number;
}

export interface Stats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
}
