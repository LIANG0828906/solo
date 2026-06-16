export interface Vec2 {
  x: number;
  y: number;
}

export type CargoType = 'crystal' | 'ore' | 'biosample';

export interface CargoItem {
  type: CargoType;
  integrity: number;
}

export type AsteroidType = 'static' | 'moving';

export interface Asteroid {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: AsteroidType;
  hp: number;
  angle: number;
  amplitude: number;
  frequency: number;
  baseX: number;
  vertices: number[];
}

export interface AsteroidDebris {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
}

export interface Pirate {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  side: 'left' | 'right';
  fireTimer: number;
  fireInterval: number;
  targetY: number;
}

export interface PirateLaser {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: Vec2[];
  life: number;
}

export interface GravityWell {
  id: string;
  x: number;
  y: number;
  radius: number;
  flowAngle: number;
}

export interface EnergyOrb {
  id: string;
  x: number;
  y: number;
  radius: number;
  pulse: number;
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
  twinkleSpeed: number;
  twinkleOffset: number;
  color: string;
  layer: 1 | 2;
  speed: number;
}

export type GamePhase = 'menu' | 'playing' | 'gameover' | 'victory';

export interface EventLogEntry {
  id: string;
  text: string;
  color: string;
  timestamp: number;
}

export interface ShieldHit {
  timer: number;
}

export interface ScreenDamage {
  timer: number;
  lifeLost: number;
}

export interface EscapeProgress {
  progress: number;
  active: boolean;
}

export interface GameState {
  phase: GamePhase;
  score: number;
  distance: number;
  maxDistance: number;
  difficulty: number;
  shield: number;
  energy: number;
  maxEnergy: number;
  lives: number;
  maxLives: number;
  shieldActive: boolean;
  shieldCooldown: number;
  shieldCooldownMax: number;
  shieldDuration: number;
  shieldDurationMax: number;
  cargo: CargoItem[];
  shipX: number;
  shipY: number;
  shipVx: number;
  shipVy: number;
  shipSpeed: number;
  escapeProgress: EscapeProgress;
  asteroids: Asteroid[];
  debris: AsteroidDebris[];
  pirates: Pirate[];
  pirateLasers: PirateLaser[];
  gravityWells: GravityWell[];
  energyOrbs: EnergyOrb[];
  particles: Particle[];
  stars: Star[];
  eventLog: EventLogEntry[];
  shieldHit: ShieldHit;
  screenDamage: ScreenDamage;
  pirateSpawnTimer: number;
  frameCount: number;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  shield: boolean;
}
