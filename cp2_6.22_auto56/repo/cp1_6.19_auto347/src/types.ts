export interface Vector2 {
  x: number;
  y: number;
}

export interface Asteroid {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  minerals: number;
  maxMinerals: number;
  noisePattern: number[];
  fragments: Fragment[];
  isBreaking: boolean;
  breakTimer: number;
  flashTimer: number;
}

export interface Fragment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface Ship {
  x: number;
  y: number;
  angle: number;
  speed: number;
  maxMinerals: number;
  minerals: number;
  health: number;
  maxHealth: number;
}

export type TurretType = 'laser' | 'missile' | 'em' | 'gatling';

export interface Turret {
  id: string;
  x: number;
  y: number;
  type: TurretType;
  health: number;
  maxHealth: number;
  range: number;
  fireRate: number;
  damage: number;
  lastFireTime: number;
  flashTimer: number;
  angle: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  type: TurretType;
  targetId?: string;
  aoeRadius?: number;
  slowEffect?: number;
  slowDuration?: number;
  life: number;
}

export interface Pirate {
  id: string;
  x: number;
  y: number;
  angle: number;
  speed: number;
  health: number;
  maxHealth: number;
  range: number;
  damage: number;
  lastAttackTime: number;
  targetId?: string;
  targetType: 'turret' | 'ship';
  slowTimer: number;
  slowAmount: number;
  deathTimer: number;
  isDying: boolean;
}

export interface MineralDrop {
  id: string;
  x: number;
  y: number;
  amount: number;
  life: number;
}

export interface GameState {
  status: 'menu' | 'playing' | 'gameover';
  score: number;
  wave: number;
  waveTimer: number;
  waveInterval: number;
  piratesPerWave: number;
  maxPiratesPerWave: number;
  ship: Ship;
  asteroids: Asteroid[];
  turrets: Turret[];
  projectiles: Projectile[];
  pirates: Pirate[];
  mineralDrops: MineralDrop[];
  canvasWidth: number;
  canvasHeight: number;
  isMining: boolean;
  miningTargetId?: string;
  keys: Record<string, boolean>;
  mouseX: number;
  mouseY: number;
  mouseDown: boolean;
  selectedTurret: TurretType | null;
  gameOverReason: string;
  leaderboard: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export type GameInput = {
  keys: Record<string, boolean>;
  mouseX: number;
  mouseY: number;
  mouseDown: boolean;
};

export const TURRET_CONFIG: Record<TurretType, {
  color: string;
  range: number;
  fireRate: number;
  damage: number;
  name: string;
  aoeRadius?: number;
  slowEffect?: number;
  slowDuration?: number;
}> = {
  laser: {
    color: '#FF5252',
    range: 200,
    fireRate: 500,
    damage: 15,
    name: '激光炮塔',
  },
  missile: {
    color: '#FFC107',
    range: 200,
    fireRate: 1000,
    damage: 50,
    name: '导弹发射器',
    aoeRadius: 50,
  },
  em: {
    color: '#7C4DFF',
    range: 200,
    fireRate: 1500,
    damage: 30,
    name: '电磁炮',
    slowEffect: 0.3,
    slowDuration: 1000,
  },
  gatling: {
    color: '#4CAF50',
    range: 200,
    fireRate: 100,
    damage: 5,
    name: '加特林',
  },
};
