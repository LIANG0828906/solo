export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export interface Polygon {
  vertices: Vec2[];
  position: Vec2;
  rotation?: number;
}

export interface Player {
  position: Vec2;
  velocity: Vec2;
  width: 16;
  height: 16;
  onGround: boolean;
  jumpsLeft: number;
  maxJumps: 2;
  lives: number;
  invulnerable: boolean;
  invulnerableTime: number;
  shieldActive: boolean;
  shieldTime: number;
  lastSafePlatform: number | null;
  facing: 'left' | 'right';
}

export interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'normal' | 'moving';
}

export interface SawTrap {
  id: number;
  x: number;
  y: number;
  radius: number;
  rotation: number;
  angularVelocity: number;
  pattern?: {
    type: string;
    params: Record<string, number>;
  };
}

export type Trap = SawTrap;

export interface Gear {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  rotation: number;
  scale: number;
  collectAnimTime: number;
}

export interface Portal {
  x: number;
  y: number;
  active: boolean;
  rotation: number;
  particleTimer: number;
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
  type: 'dust' | 'gear' | 'shield' | 'portal' | 'doubleJump';
}

export interface LevelData {
  seed: number;
  platforms: Platform[];
  traps: Trap[];
  gears: Gear[];
  portal: Portal;
  levelWidth: number;
  levelHeight: number;
  requiredGears: number;
}

export type GameState = 'menu' | 'playing' | 'paused' | 'levelComplete' | 'gameOver' | 'gameWin';

export interface HighScore {
  name: string;
  score: number;
  level: number;
  date: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
}
