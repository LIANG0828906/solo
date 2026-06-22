export enum RoomType {
  CORE = 'core',
  TREASURE = 'treasure',
  MONSTER = 'monster',
  CORRIDOR = 'corridor',
  EMPTY = 'empty'
}

export enum GameState {
  TOPDOWN = 'topdown',
  FIRSTPERSON = 'firstperson',
  TRANSITION = 'transition'
}

export enum EnemyType {
  SKELETON = 'skeleton',
  SLIME = 'slime'
}

export interface Connections {
  north: boolean;
  south: boolean;
  east: boolean;
  west: boolean;
}

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  deathTimer: number;
}

export interface Fireball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  type: RoomType;
  templateId: number;
  connections: Connections;
  explored: boolean;
  enemies: Enemy[];
  treasures: number;
  cleared: boolean;
  wallMap: number[][];
  clearFlashTimer: number;
}

export interface Dungeon {
  seed: number;
  gridWidth: number;
  gridHeight: number;
  rooms: Room[][];
  coreRoom: { x: number; y: number };
}

export interface Player {
  x: number;
  y: number;
  angle: number;
  currentRoomX: number;
  currentRoomY: number;
  treasuresCollected: number;
  bobOffset: number;
  bobTimer: number;
}

export interface InputState {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
  m: boolean;
  mouseDown: boolean;
  mouseX: number;
  mouseY: number;
  isDragging: boolean;
  lastMouseX: number;
}

export interface RoomTemplate {
  id: number;
  size: number;
  wallMap: number[][];
  defaultConnections: Connections;
}

export interface GameStats {
  enemiesKilled: number;
  totalTreasures: number;
  currentRoomType: RoomType;
  enemiesAlive: number;
}
