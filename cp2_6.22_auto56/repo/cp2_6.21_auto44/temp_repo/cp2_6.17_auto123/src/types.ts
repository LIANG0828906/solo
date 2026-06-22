export type CellType = 'path' | 'buildable' | 'tower';

export interface Cell {
  x: number;
  y: number;
  type: CellType;
}

export type TowerType = 'arrow' | 'fire';

export interface TowerStats {
  damage: number;
  range: number;
  attackInterval: number;
  burnDamage?: number;
  burnDuration?: number;
}

export interface TowerDef {
  type: TowerType;
  name: string;
  cost: number;
  color: string;
  stats: TowerStats;
}

export interface Tower {
  id: string;
  type: TowerType;
  x: number;
  y: number;
  level: number;
  lastAttackTime: number;
  targetId: string | null;
}

export type MonsterType = 'normal' | 'elite' | 'boss';

export interface MonsterDef {
  readonly type: MonsterType;
  readonly color: string;
  readonly hp: number;
  readonly speed: number;
  readonly defense: number;
  readonly goldReward: number;
  readonly size: number;
}

export type StatusEffectType = 'burn';

export interface StatusEffect {
  type: StatusEffectType;
  damage: number;
  remainingTime: number;
}

export interface BurnEffect extends StatusEffect {
  type: 'burn';
  damage: number;
  remainingTime: number;
}

export interface Monster {
  id: string;
  type: MonsterType;
  hp: number;
  maxHp: number;
  speed: number;
  defense: number;
  goldReward: number;
  color: string;
  size: number;
  pathIndex: number;
  progress: number;
  x: number;
  y: number;
  effects: StatusEffect[];
}

export interface WaveConfig {
  waveNumber: number;
  totalMonsters: number;
  eliteRatio: number;
  hasBoss: boolean;
  spawnInterval: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

export interface UpgradePanelState {
  visible: boolean;
  towerId: string | null;
  screenX: number;
  screenY: number;
}

export interface GameState {
  gridCols: number;
  gridRows: number;
  cellSize: number;
  path: Cell[];
  cells: Cell[][];
  towers: Tower[];
  monsters: Monster[];
  gold: number;
  lives: number;
  wave: number;
  totalWaves: number;
  maxWaveMonsters: number[];
  waveActive: boolean;
  gameOver: boolean;
  victory: boolean;
  selectedTowerType: TowerType | null;
  upgradePanel: UpgradePanelState;
  fps: number;
}
