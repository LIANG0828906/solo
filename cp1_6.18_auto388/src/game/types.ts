export interface Vec2 {
  x: number;
  y: number;
}

export interface PlayerState {
  pos: Vec2;
  vel: Vec2;
  radius: number;
  facingRight: boolean;
  isGrounded: boolean;
  isAlive: boolean;
}

export interface ShadowClone {
  id: string;
  pos: Vec2;
  direction: Vec2;
  shadowRect: ShadowRect;
}

export interface ShadowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Block {
  id: string;
  pos: Vec2;
  vel: Vec2;
  width: number;
  height: number;
  isGrounded: boolean;
}

export interface PressurePlate {
  id: string;
  pos: Vec2;
  width: number;
  height: number;
  activated: boolean;
  linkedDoorId: string;
}

export interface MovingPlatform {
  id: string;
  pos: Vec2;
  width: number;
  height: number;
  startPos: Vec2;
  endPos: Vec2;
  speed: number;
  progress: number;
  direction: number;
}

export interface Trap {
  id: string;
  pos: Vec2;
  width: number;
  height: number;
}

export interface Door {
  id: string;
  pos: Vec2;
  width: number;
  height: number;
  open: boolean;
}

export interface ExitPortal {
  id: string;
  pos: Vec2;
  radius: number;
}

export interface Platform {
  id: string;
  pos: Vec2;
  width: number;
  height: number;
}

export interface LevelMap {
  id: number;
  name: string;
  width: number;
  height: number;
  playerStart: Vec2;
  platforms: Platform[];
  blocks: Block[];
  pressurePlates: PressurePlate[];
  movingPlatforms: MovingPlatform[];
  traps: Trap[];
  doors: Door[];
  exitPortal: ExitPortal;
}

export interface LevelProgress {
  currentLevel: number;
  completedLevels: number[];
  isPlaying: boolean;
  isPaused: boolean;
}

export interface CollisionEvent {
  type: 'player_ground' | 'player_trap' | 'player_exit' | 'player_door' | 'shadow_plate' | 'block_plate' | 'player_block' | 'block_ground';
  entityId?: string;
  targetId?: string;
}

export interface GameStats {
  startTime: number;
  shadowPlacements: number;
}

export interface GameState {
  player: PlayerState;
  shadows: ShadowClone[];
  level: LevelMap | null;
  progress: LevelProgress;
  stats: GameStats;
  camera: Vec2;
  gamePhase: 'menu' | 'levelSelect' | 'playing' | 'transition' | 'victory' | 'gameOver';
  transitionAlpha: number;
  nextLevel: number;
  particles: Particle[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export type GameAction =
  | { type: 'SET_PHASE'; phase: GameState['gamePhase'] }
  | { type: 'SET_LEVEL'; level: LevelMap }
  | { type: 'UPDATE_PLAYER'; player: Partial<PlayerState> }
  | { type: 'ADD_SHADOW'; shadow: ShadowClone }
  | { type: 'REMOVE_SHADOW'; id: string }
  | { type: 'CLEAR_SHADOWS' }
  | { type: 'UPDATE_SHADOW_RECT'; id: string; shadowRect: ShadowRect }
  | { type: 'UPDATE_BLOCK'; id: string; data: Partial<Block> }
  | { type: 'UPDATE_PLATE'; id: string; activated: boolean }
  | { type: 'UPDATE_MOVING_PLATFORM'; id: string; data: Partial<MovingPlatform> }
  | { type: 'UPDATE_DOOR'; id: string; open: boolean }
  | { type: 'SET_CAMERA'; camera: Vec2 }
  | { type: 'COMPLETE_LEVEL'; levelId: number }
  | { type: 'SET_TRANSITION'; alpha: number; nextLevel: number }
  | { type: 'RESET_LEVEL' }
  | { type: 'INCREMENT_SHADOW_PLACEMENTS' }
  | { type: 'SET_PARTICLES'; particles: Particle[] }
  | { type: 'KILL_PLAYER' };
