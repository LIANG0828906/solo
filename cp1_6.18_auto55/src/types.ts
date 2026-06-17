export enum TerrainType {
  OPEN = 'open',
  TREE = 'tree',
  HIGHLAND = 'highland',
  RUIN = 'ruin',
}

export enum UnitType {
  COMMANDER = 'commander',
  SCOUT = 'scout',
}

export enum GamePhase {
  PLAYING = 'playing',
  WIN = 'win',
  LOSE = 'lose',
}

export interface Position {
  x: number;
  y: number;
}

export interface Unit {
  id: string;
  type: UnitType;
  position: Position;
  hp: number;
  maxHp: number;
  visionRadius: number;
  visionAngle: number;
  moveSpeed: number;
  isSelected: boolean;
  facing: number;
}

export interface Enemy {
  id: string;
  position: Position;
  visionRadius: number;
  moveSpeed: number;
  patrolTarget: Position;
}

export interface TerrainCell {
  type: TerrainType;
  height: number;
  blockRate: number;
}

export interface MapData {
  width: number;
  height: number;
  cellSize: number;
  grid: TerrainCell[][];
  extractionPoint: Position;
}

export interface FogState {
  visibleCells: Set<string>;
  texture: HTMLCanvasElement | null;
  coverage: number;
}

export interface GameState {
  phase: GamePhase;
  mapData: MapData | null;
  units: Unit[];
  enemies: Enemy[];
  fogState: FogState;
  selectedUnitId: string | null;
  extractionProgress: number;
  fps: number;
  lastFrameTime: number;
  inputDelay: number;
  flashEffect: boolean;
}
