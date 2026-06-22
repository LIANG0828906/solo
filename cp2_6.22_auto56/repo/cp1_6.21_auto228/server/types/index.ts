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
