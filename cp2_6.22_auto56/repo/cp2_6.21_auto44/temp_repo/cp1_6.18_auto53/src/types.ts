export type CardType = 'attack' | 'defense' | 'special';

export type SpecialEffect = 'draw' | 'discard';

export interface Card {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  value: number;
  effect?: SpecialEffect;
  description: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  health: number;
  maxHealth: number;
  armor: number;
  energy: number;
  maxEnergy: number;
  hand: Card[];
  deck: Card[];
  graveyard: Card[];
}

export type GamePhase = 'playerTurn' | 'opponentTurn' | 'gameOver' | 'transitioning';

export interface BattlefieldCard {
  card: Card;
  timestamp: number;
  ownerId: string;
}

export interface GameState {
  phase: GamePhase;
  turn: number;
  timeRemaining: number;
  player: Player;
  opponent: Player;
  battlefield: BattlefieldCard[];
  winner: string | null;
  transitionCountdown: number;
  transitionMessage: string;
  shakingCardId: string | null;
}
