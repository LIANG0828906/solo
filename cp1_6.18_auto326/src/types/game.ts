export type GamePhase = 'editing' | 'simulating' | 'won' | 'lost';

export type BlockType = 'n-pole' | 's-pole' | 'neutral';

export interface Block {
  id: string;
  type: BlockType;
  gridX: number;
  gridY: number;
}

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
}

export interface LevelData {
  id: number;
  name: string;
  startX: number;
  startY: number;
  goalX: number;
  goalY: number;
  availableBlocks: {
    'n-pole': number;
    's-pole': number;
    'neutral': number;
  };
  obstacles?: {
    gridX: number;
    gridY: number;
    width: number;
    height: number;
  }[];
}

export interface GameState {
  currentLevel: number;
  completedLevels: number[];
  phase: GamePhase;
  placedBlocks: Block[];
  availableBlocks: {
    'n-pole': number;
    's-pole': number;
    'neutral': number;
  };
  ball: BallState;
  timer: number;
  moveCount: number;
  isDragging: boolean;
  draggingBlockType: BlockType | null;
  fireworksActive: boolean;
}

export interface GameActions {
  startSimulation: () => void;
  resetLevel: () => void;
  placeBlock: (type: BlockType, gridX: number, gridY: number) => void;
  removeBlock: (blockId: string) => void;
  updateBall: (x: number, y: number, vx: number, vy: number) => void;
  addTrailPoint: (x: number, y: number) => void;
  incrementTimer: () => void;
  incrementMoveCount: () => void;
  setDragging: (isDragging: boolean, type: BlockType | null) => void;
  completeLevel: () => void;
  nextLevel: () => void;
  loadLevel: (levelIndex: number) => void;
}

export type GameStore = GameState & GameActions;
