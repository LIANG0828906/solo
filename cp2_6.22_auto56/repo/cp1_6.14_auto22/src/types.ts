export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Card {
  id: string;
  name: string;
  cost: number;
  attack: number;
  health: number;
  rarity: Rarity;
  skill: string;
  image: string;
}

export interface DeckCard {
  cardId: string;
  count: number;
}

export interface Deck {
  id: string;
  name: string;
  cards: DeckCard[];
  createdAt: string;
  updatedAt: string;
}

export interface BattleTurnAction {
  type: 'play' | 'hero_skill' | 'attack';
  player: 1 | 2;
  cardName?: string;
  damage?: number;
  hero1Health?: number;
  hero2Health?: number;
  mana1?: number;
  mana2?: number;
  power1?: number;
  power2?: number;
  timestamp: number;
}

export interface BattleTurn {
  turn: number;
  actions: BattleTurnAction[];
  manaData: number[];
  powerData: number[];
}

export interface BattleRecord {
  id: string;
  player1: string;
  player2: string;
  winner: 1 | 2;
  turns: BattleTurn[];
  totalTurns: number;
  createdAt: string;
}

export interface UserStats {
  deckCount: number;
  battleCount: number;
  topCards: { cardId: string; count: number }[];
}

export interface AppState {
  cards: Card[];
  decks: Deck[];
  battles: BattleRecord[];
  currentDeck: Deck | null;
  userStats: UserStats;
  isLoading: boolean;
}
