export type CellType = 'empty' | 'wall' | 'exit' | 'start' | 'portal';

export interface Position {
  x: number;
  y: number;
}

export interface GridCell {
  type: CellType;
  visible: boolean;
  explored: boolean;
  caveIndex: number;
}

export interface SonarPulse {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  startTime: number;
  duration: number;
  active: boolean;
}

export interface EchoLine {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  startTime: number;
  duration: number;
}

export interface WallHighlight {
  id: number;
  gridX: number;
  gridY: number;
  startTime: number;
  duration: number;
}

export interface Crystal {
  id: number;
  gridX: number;
  gridY: number;
  caveIndex: number;
  collected: boolean;
}

export interface PoisonMushroom {
  id: number;
  gridX: number;
  gridY: number;
  stunned: boolean;
  stunEndTime: number;
  knockbackDir: Position | null;
}

export interface WanderingBat {
  id: number;
  gridX: number;
  gridY: number;
  path: Position[];
  pathIndex: number;
  moveProgress: number;
  stunned: boolean;
  stunEndTime: number;
}

export interface CaveData {
  index: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  startPos: Position;
  exitPositions: Position[];
  crystal: Crystal;
  mushrooms: PoisonMushroom[];
  wanderingBats: WanderingBat[];
  isCenter: boolean;
}

export interface LevelData {
  width: number;
  height: number;
  cellSize: number;
  grid: GridCell[][];
  caves: CaveData[];
  portal: Position | null;
}

export type GameStatus = 'playing' | 'paused' | 'gameover' | 'victory';

export interface GameState {
  status: GameStatus;
  score: number;
  timeLeft: number;
  crystalsCollected: number;
  totalCrystals: number;
  playerGridPos: Position;
  playerPixelPos: Position;
  currentCaveIndex: number;
}

export type EventType =
  | 'sonar:emit'
  | 'sonar:echo'
  | 'sonar:wallHit'
  | 'level:ready'
  | 'level:cellRevealed'
  | 'player:move'
  | 'player:collision'
  | 'enemy:stunned'
  | 'crystal:collected'
  | 'portal:entered'
  | 'game:statusChange';

export interface GameEvent {
  type: EventType;
  payload?: Record<string, unknown>;
}

export type EventHandler = (event: GameEvent) => void;

export class EventBus {
  private handlers: Map<EventType, Set<EventHandler>> = new Map();

  on(type: EventType, handler: EventHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  off(type: EventType, handler: EventHandler): void {
    this.handlers.get(type)?.delete(handler);
  }

  emit(event: GameEvent): void {
    this.handlers.get(event.type)?.forEach((h) => h(event));
  }
}
