export type TerrainType = 'sand' | 'dune' | 'ore';

export interface GridCell {
  terrain: TerrainType;
  gridX: number;
  gridY: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Player {
  id: number;
  position: Position;
  health: number;
  maxHealth: number;
  ammo: number;
  angle: number;
  color: string;
  name: string;
}

export interface Wind {
  angle: number;
  strength: number;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ownerId: number;
  trail: Position[];
  active: boolean;
}

export type EffectType = 'damage' | 'explosion' | 'bounce';

export interface Effect {
  id: number;
  type: EffectType;
  x: number;
  y: number;
  value?: number;
  startTime: number;
  duration: number;
}

export type GameStatus = 'playing' | 'ended';

export interface GameState {
  map: GridCell[][];
  players: Player[];
  currentPlayer: number;
  wind: Wind;
  projectile: Projectile | null;
  gameStatus: GameStatus;
  winner: number | null;
  effects: Effect[];
  screenShake: boolean;
  mapLoaded: boolean;
}

export type GameAction =
  | { type: 'INIT_GAME' }
  | { type: 'ADJUST_ANGLE'; playerId: number; delta: number }
  | { type: 'FIRE_PROJECTILE'; playerId: number }
  | { type: 'UPDATE_PROJECTILE'; projectile: Projectile }
  | { type: 'PROJECTILE_HIT_TRUCK'; targetId: number; damage: number; x: number; y: number }
  | { type: 'PROJECTILE_HIT_DUNE'; bounceVelocity: { vx: number; vy: number }; x: number; y: number }
  | { type: 'PROJECTILE_HIT_ORE'; x: number; y: number }
  | { type: 'PROJECTILE_OUT_OF_BOUNDS' }
  | { type: 'END_TURN' }
  | { type: 'END_GAME'; winner: number }
  | { type: 'RESET_GAME' }
  | { type: 'ADD_EFFECT'; effect: Effect }
  | { type: 'REMOVE_EFFECT'; effectId: number }
  | { type: 'SET_SCREEN_SHAKE'; shake: boolean }
  | { type: 'SET_MAP_LOADED'; loaded: boolean };
