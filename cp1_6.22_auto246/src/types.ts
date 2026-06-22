export type Player = 'player1' | 'player2';

export interface GridNode {
  id: string;
  row: number;
  col: number;
  owner: Player | null;
  rotation: number;
  color?: string;
}

export interface LightPath {
  id: string;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  owner: Player;
  progress: number;
  createdAt: number;
  startNode?: GridNode;
  endNode?: GridNode;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size?: number;
  alpha?: number;
}

export interface EntangleEffect {
  id: string;
  row: number;
  col: number;
  progress: number;
  oldColor: string;
  newColor: string;
  particles: Particle[];
  node?: GridNode;
}

export interface GameStateSnapshot {
  grid: (GridNode | null)[][];
  currentPlayer: Player;
  scores: Record<Player, number>;
  undoCount: Record<Player, number>;
}

export interface GameState {
  grid: (GridNode | null)[][];
  currentPlayer: Player;
  scores: Record<Player, number>;
  timeRemaining: number;
  undoCount: Record<Player, number>;
  selectedNode: { row: number; col: number } | null;
  lightPaths: LightPath[];
  entangleEffects: EntangleEffect[];
  gameOver: boolean;
  winner: Player | 'draw' | null;
  history: GameStateSnapshot[];
}
