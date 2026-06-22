export interface Vector2 {
  x: number;
  y: number;
}

export type ParticleType = 'explosion' | 'trail' | 'mining' | 'upgrade' | 'bulletTrail';

export interface Particle {
  id: string;
  position: Vector2;
  velocity: Vector2;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: ParticleType;
}

export interface Asteroid {
  id: string;
  position: Vector2;
  velocity?: Vector2;
  radius: number;
  size?: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  minerals: number;
  maxMinerals: number;
  fragments: number;
  vertices: Vector2[];
}

export interface Bullet {
  id: string;
  position: Vector2;
  velocity: Vector2;
  color: string;
  ownerId: string;
  damage: number;
  life: number;
  trail: Particle[];
}

export interface Ship {
  id: string;
  playerId: string;
  position: Vector2;
  velocity: Vector2;
  rotation: number;
  minerals: number;
  health: number;
  maxHealth: number;
  color: string;
  speed: number;
  fireRate: number;
  shieldMax: number;
  shieldActive: boolean;
  isShieldActive: boolean;
  shieldHp: number;
  shieldHealth: number;
  shieldCooldown: number;
  weaponCooldown: number;
  isMining: boolean;
  miningTarget: string | null;
  upgradeFlash: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  kills: number;
  mineralsCollected: number;
}

export type GameStateType = 'menu' | 'playing' | 'paused' | 'gameOver';

export type UpgradeType = 'speed' | 'fireRate' | 'shield';

export interface GameStats {
  startTime: number;
  elapsedTime: number;
  totalBulletsFired: number;
  totalMineralsMined: number;
  asteroidsDestroyed: number;
}

export interface GameState {
  ships: Ship[];
  asteroids: Asteroid[];
  particles: Particle[];
  bullets: Bullet[];
}
