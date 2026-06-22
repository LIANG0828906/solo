export interface Position {
  x: number;
  y: number;
}

export type TowerType = 'laser' | 'cannon' | 'freeze';

export type EnemyType = 'low' | 'medium' | 'high';

export interface Tower {
  id: string;
  type: TowerType;
  gridX: number;
  gridY: number;
  x: number;
  y: number;
  level: number;
  damage: number;
  range: number;
  attackSpeed: number;
  lastAttackTime: number;
  target: Enemy | null;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  pathIndex: number;
  pathProgress: number;
  slowEffect: number;
  slowDuration: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  controlX: number;
  controlY: number;
  progress: number;
  duration: number;
  damage: number;
  type: TowerType;
  splashRadius: number;
  slowAmount: number;
  slowDuration: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface WaveConfig {
  waveNumber: number;
  enemies: {
    type: EnemyType;
    count: number;
    delay: number;
  }[];
}

export interface LevelConfig {
  id: string;
  name: string;
  totalWaves: number;
  waves: WaveConfig[];
  path: Position[];
  gridCols: number;
  gridRows: number;
  startingLives: number;
  startingScore: number;
}

export interface GameRecord {
  id: string;
  playerName: string;
  score: number;
  kills: number;
  remainingLives: number;
  levelId: string;
  timestamp: number;
}

export type GamePhase = 'preparing' | 'wave' | 'waveEnd' | 'victory' | 'defeat';

export interface GameState {
  phase: GamePhase;
  currentWave: number;
  totalWaves: number;
  lives: number;
  score: number;
  kills: number;
  towers: Tower[];
  enemies: Enemy[];
  projectiles: Projectile[];
  particles: Particle[];
  waveCountdown: number;
  selectedTowerType: TowerType | null;
  selectedTower: Tower | null;
}

export interface TowerConfig {
  type: TowerType;
  name: string;
  color: string;
  damage: number;
  range: number;
  attackSpeed: number;
  cost: number;
  upgradeCost: number;
  description: string;
}

export const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  laser: {
    type: 'laser',
    name: '激光塔',
    color: '#00FFCC',
    damage: 30,
    range: 100,
    attackSpeed: 1,
    cost: 100,
    upgradeCost: 200,
    description: '快速单体攻击'
  },
  cannon: {
    type: 'cannon',
    name: '火炮塔',
    color: '#FF6B6B',
    damage: 50,
    range: 100,
    attackSpeed: 0.5,
    cost: 150,
    upgradeCost: 200,
    description: '范围溅射伤害'
  },
  freeze: {
    type: 'freeze',
    name: '冰冻塔',
    color: '#4ECDC4',
    damage: 15,
    range: 100,
    attackSpeed: 2/3,
    cost: 120,
    upgradeCost: 200,
    description: '减速敌人移动'
  }
};

export const ENEMY_CONFIGS: Record<EnemyType, { color: string; health: number; speed: number; score: number }> = {
  low: { color: '#FFA500', health: 50, speed: 1, score: 10 },
  medium: { color: '#FF4444', health: 120, speed: 0.9, score: 25 },
  high: { color: '#AA00FF', health: 250, speed: 0.8, score: 50 }
};

export const HEX_SIZE = 40;
