export type CellType = 'wall' | 'floor';

export interface Cell {
  type: CellType;
  x: number;
  y: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Character {
  position: Position;
  hp: number;
  maxHp: number;
  attack: number;
  moveRange: number;
  crystalsCollected: number;
}

export interface Crystal {
  position: Position;
  id: string;
}

export type AIState = 'patrol' | 'chase' | 'flee';

export type Turn = 'player' | 'ai';

export type GameStatus = 'playing' | 'playerWin' | 'aiWin';

export type Direction = 'up' | 'down' | 'left' | 'right';

export type AIActionType = 'move' | 'attack' | 'wait';

export interface AIAction {
  type: AIActionType;
  direction?: Direction;
  steps?: number;
}

export type PlayerActionType = 'move' | 'attack' | 'wait';

export interface PlayerAction {
  type: PlayerActionType;
  direction?: Direction;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  angle: number;
  distance: number;
}

export interface GameState {
  grid: Cell[][];
  player: Character;
  ai: Character;
  crystals: Crystal[];
  turn: Turn;
  turnCount: number;
  aiState: AIState;
  gameStatus: GameStatus;
  isAnimating: boolean;
  flashEffect: 'attack' | 'damage' | null;
  damagedPosition: Position | null;
  crystalBurstPosition: Position | null;
  particles: Particle[];
}
