export type ShipType = 'scout' | 'frigate' | 'capital';
export type PlanetType = 'neutral' | 'friendly1' | 'friendly2' | 'enemy1' | 'enemy2';
export type Player = 1 | 2;
export type Winner = Player | 'draw' | null;

export interface Ship {
  id: string;
  type: ShipType;
  name: string;
  attack: number;
  defense: number;
  hp: number;
  maxHp: number;
  moveRange: number;
  player: Player;
  hasMoved: boolean;
  hasAttacked: boolean;
}

export interface Cell {
  x: number;
  y: number;
  planet: PlanetType | null;
  ships: Ship[];
  isBase: boolean;
  baseOwner?: Player;
}

export interface GameState {
  id: string;
  board: Cell[][];
  currentPlayer: Player;
  turn: number;
  maxTurns: number;
  isDeploymentPhase: boolean;
  resources: { player1: number; player2: number };
  selectedCell: { x: number; y: number } | null;
  selectedShip: Ship | null;
  battleReport: string | null;
  gameOver: boolean;
  winner: Winner;
  scores: { player1: number; player2: number };
  startTime: number;
  playerNames: { player1: string; player2: string };
  animatingCell: { x: number; y: number } | null;
  validMoves: { x: number; y: number }[];
  validAttacks: { x: number; y: number }[];
}

export interface LeaderboardEntry {
  id: string;
  player1: string;
  player2: string;
  winner: string;
  turns: number;
  score1: number;
  score2: number;
  duration: number;
  timestamp: number;
}

export const SHIP_CONFIGS: Record<ShipType, Omit<Ship, 'id' | 'player' | 'hasMoved' | 'hasAttacked'>> = {
  scout: { type: 'scout', name: '侦察舰', attack: 2, defense: 1, hp: 5, maxHp: 5, moveRange: 3 },
  frigate: { type: 'frigate', name: '护卫舰', attack: 4, defense: 3, hp: 10, maxHp: 10, moveRange: 2 },
  capital: { type: 'capital', name: '主力舰', attack: 8, defense: 5, hp: 20, maxHp: 20, moveRange: 1 },
};

export const SHIP_COSTS: Record<ShipType, number> = {
  scout: 3,
  frigate: 6,
  capital: 10,
};

export const SHIP_VALUES: Record<ShipType, number> = {
  scout: 1,
  frigate: 3,
  capital: 6,
};

export const SHIP_ICONS: Record<ShipType, string> = {
  scout: '🛸',
  frigate: '🚀',
  capital: '🛡️',
};

export const PLANET_ICONS: Record<PlanetType, string> = {
  neutral: '🪐',
  friendly1: '🌏',
  friendly2: '🌏',
  enemy1: '🔥',
  enemy2: '🔥',
};
