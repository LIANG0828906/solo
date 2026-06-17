export type TowerType = 'machinegun' | 'flame' | 'slow'
export type ZombieType = 'normal' | 'elite'
export type GameState = 'preparing' | 'playing' | 'paused' | 'gameover' | 'victory'

export interface TowerConfig {
  type: TowerType
  name: string
  cost: number
  range: number
  damage: number
  attackSpeed: number
  color: number
  trailColor: number
}

export interface Tower extends TowerConfig {
  id: string
  gridX: number
  gridY: number
  level: number
  lastAttackTime: number
  muzzleFlashTime: number
}

export interface ZombieConfig {
  type: ZombieType
  health: number
  speed: number
  reward: number
  scale: number
  color: number
}

export interface Zombie extends ZombieConfig {
  id: string
  currentHealth: number
  pathIndex: number
  progress: number
  x: number
  y: number
  isDying: boolean
  deathTime: number
  isHit: boolean
  hitTime: number
  slowEffect: number
  slowEndTime: number
}

export interface Projectile {
  id: string
  towerType: TowerType
  startX: number
  startY: number
  targetId: string
  targetX: number
  targetY: number
  progress: number
  speed: number
  damage: number
  trail: Array<{ x: number; y: number; alpha: number }>
}

export interface DeathEffect {
  id: string
  x: number
  y: number
  startTime: number
  duration: number
}

export interface WaveConfig {
  waveNumber: number
  zombieCount: number
  speedMultiplier: number
  eliteChance: number
}

export const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  machinegun: {
    type: 'machinegun',
    name: '机枪塔',
    cost: 50,
    range: 3,
    damage: 10,
    attackSpeed: 1,
    color: 0x4CAF50,
    trailColor: 0xFFEB3B
  },
  flame: {
    type: 'flame',
    name: '火焰塔',
    cost: 80,
    range: 2,
    damage: 25,
    attackSpeed: 0.5,
    color: 0xFF5722,
    trailColor: 0xFF9800
  },
  slow: {
    type: 'slow',
    name: '减速塔',
    cost: 60,
    range: 4,
    damage: 5,
    attackSpeed: 1,
    color: 0x2196F3,
    trailColor: 0x00BCD4
  }
}

export const ZOMBIE_CONFIGS: Record<ZombieType, ZombieConfig> = {
  normal: {
    type: 'normal',
    health: 30,
    speed: 1,
    reward: 10,
    scale: 1,
    color: 0x7CB342
  },
  elite: {
    type: 'elite',
    health: 90,
    speed: 0.8,
    reward: 50,
    scale: 1.5,
    color: 0xB71C1C
  }
}

export const GRID_SIZE = 10
export const CELL_SIZE = 1
export const INITIAL_GOLD = 100
export const INITIAL_LIVES = 20
export const TOTAL_WAVES = 10
export const WAVE_PREP_TIME = 15
export const ZOMBIE_SPAWN_INTERVAL = 1
