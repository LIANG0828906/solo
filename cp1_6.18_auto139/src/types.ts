export enum TerrainType {
  PLAIN = 'plain',
  FOREST = 'forest',
  ROCK = 'rock'
}

export enum PlayerType {
  BLUE = 'blue',
  RED = 'red'
}

export enum ActionType {
  MOVE = 'move',
  ATTACK = 'attack',
  END_TURN = 'end_turn'
}

export interface AxialCoord {
  q: number;
  r: number;
}

export interface HexCell {
  q: number;
  r: number;
  terrain: TerrainType;
}

export interface HeroUnit {
  id: string;
  name: string;
  initials: string;
  player: PlayerType;
  position: AxialCoord;
  previousPosition: AxialCoord | null;
  attack: number;
  defense: number;
  maxHp: number;
  hp: number;
  maxMoveSteps: number;
  moveSteps: number;
  hasActed: boolean;
  isAnimating: boolean;
}

export interface GameState {
  grid: HexCell[][];
  units: HeroUnit[];
  currentPlayer: PlayerType;
  turnNumber: number;
  selectedUnitId: string | null;
  highlightedHexes: AxialCoord[];
  gameOver: boolean;
  winner: PlayerType | null;
}

export interface AnimationState {
  type: 'move' | 'attack' | 'death';
  unitId: string;
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  targetId?: string;
  progress: number;
  duration: number;
  frame?: number;
  maxFrames?: number;
}

export interface NetworkMessage {
  type: ActionType;
  player: PlayerType;
  unitId?: string;
  target?: AxialCoord;
  targetUnitId?: string;
  timestamp: number;
}

export interface MoveAction {
  unitId: string;
  to: AxialCoord;
  path: AxialCoord[];
}

export interface AttackAction {
  unitId: string;
  targetUnitId: string;
}
