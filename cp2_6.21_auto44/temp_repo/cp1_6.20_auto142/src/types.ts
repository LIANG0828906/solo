export interface Position {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export type RoomEventType = 'empty' | 'spike' | 'treasure' | 'swamp' | 'portal';

export interface RoomData {
  position: Position;
  eventType: RoomEventType;
  explored: boolean;
  eventTriggered: boolean;
  flashUntil?: number;
  swampUntil?: number;
}

export interface PlayerState {
  position: Position;
  hp: number;
  maxHp: number;
  coins: number;
  direction: Direction;
  slowUntil: number;
}

export type ParticleType = 'coin' | 'fire' | 'portal' | 'swamp';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: ParticleType;
  angle?: number;
  angularVel?: number;
}

export interface GameConfig {
  gridWidth: number;
  gridHeight: number;
  roomSize: number;
  roomBorder: number;
  moveCooldown: number;
  maxHp: number;
  startPosition: Position;
  eventProbabilities: Record<Exclude<RoomEventType, 'empty'>, number>;
}
