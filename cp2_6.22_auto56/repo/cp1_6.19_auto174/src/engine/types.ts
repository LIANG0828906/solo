export interface Debris {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  vertices: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  orbitCenterX: number;
  orbitCenterY: number;
  orbitA: number;
  orbitB: number;
  orbitAngle: number;
  orbitSpeed: number;
}

export interface Ship {
  x: number;
  y: number;
  angle: number;
  speed: number;
  lives: number;
  shieldCooldown: number;
  isInvincible: boolean;
  invincibleTimer: number;
  hitFlashTimer: number;
}

export interface SatellitePart {
  id: string;
  x: number;
  y: number;
  collected: boolean;
  glowPhase: number;
}

export interface Warning {
  debrisId: string;
  distance: number;
  direction: string;
  timeToCollision: number;
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

export interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
}

export type GameStatus = 'playing' | 'gameover';

export interface GameState {
  debrisList: Debris[];
  satelliteParts: SatellitePart[];
  ship: Ship;
  score: number;
  highScore: number;
  warnings: Warning[];
  gameStatus: GameStatus;
  beamActive: boolean;
  beamTimer: number;
  beamCooldown: number;
  beamAngle: number;
  difficultyMultiplier: number;
  partsCollected: number;
  particles: Particle[];
  stars: Star[];
  galaxyAngle: number;
  canvasWidth: number;
  canvasHeight: number;
}
