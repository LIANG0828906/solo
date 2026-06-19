export enum TowerType {
  LOW = 'low',
  MID = 'mid',
  HIGH = 'high',
  SHIELD = 'shield',
}

export enum ArmorType {
  LIGHT = 'light',
  HEAVY = 'heavy',
}

export interface AxialCoord {
  q: number
  r: number
}

export interface Tower {
  id: string
  type: TowerType
  q: number
  r: number
  x: number
  y: number
  frequency: number
  color: string
  lastFireTime: number
  reflectionRate: number
}

export interface Monster {
  id: string
  armor: ArmorType
  hp: number
  maxHp: number
  x: number
  y: number
  pathIndex: number
  pathProgress: number
  isHit: boolean
  hitTimer: number
  spawnDelay: number
}

export interface Wave {
  id: string
  centerX: number
  centerY: number
  radius: number
  maxRadius: number
  speed: number
  frequency: number
  color: string
  opacity: number
  damage: number
  reflections: number
  sourceTowerId: string
  hitMonsters: Set<string>
}

export interface Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export interface LogEntry {
  timestamp: number
  type: 'fire' | 'hit' | 'reflect' | 'kill' | 'wave'
  message: string
}

export interface DeployAnimation {
  id: string
  x: number
  y: number
  color: string
  startTime: number
}

export interface GameState {
  towers: Tower[]
  monsters: Monster[]
  waves: Wave[]
  particles: Particle[]
  deployAnimations: DeployAnimation[]
  score: number
  displayScore: number
  waveNumber: number
  totalWaves: number
  waveStatus: 'idle' | 'countdown' | 'spawning' | 'active' | 'complete'
  waveCountdown: number
  monstersToSpawn: number
  monstersSpawnTimer: number
  monstersRemaining: number
  waveDamageDealt: number
  waveDamagePotential: number
  selectedTowerType: TowerType
  shieldReflectionRate: number
  logs: LogEntry[]
  gameTime: number
  isRunning: boolean
}

export const TOWER_CONFIG: Record<TowerType, { frequency: number; color: string; label: string }> = {
  [TowerType.LOW]: { frequency: 80, color: '#4fc3f7', label: '80Hz' },
  [TowerType.MID]: { frequency: 500, color: '#81c784', label: '500Hz' },
  [TowerType.HIGH]: { frequency: 2000, color: '#ff8a65', label: '2000Hz' },
  [TowerType.SHIELD]: { frequency: 0, color: '#ab47bc', label: '护盾' },
}

export const GRID_COLS = 20
export const GRID_ROWS = 20
export const HEX_SIZE = 24

export const PATH_COORDS: AxialCoord[] = (() => {
  const path: AxialCoord[] = []
  for (let q = 0; q < 6; q++) {
    path.push({ q, r: 9 })
  }
  for (let r = 10; r < 13; r++) {
    path.push({ q: 5, r })
  }
  for (let q = 6; q < 20; q++) {
    path.push({ q, r: 12 })
  }
  return path
})()
