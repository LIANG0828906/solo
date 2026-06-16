export interface Vec2 {
  x: number
  y: number
}

export interface CarState {
  position: Vec2
  velocity: Vec2
  angle: number
  angularVelocity: number
  speed: number
  steerAngle: number
  isDrifting: boolean
  driftTime: number
  nitroEnergy: number
  nitroActive: boolean
  nitroTime: number
}

export interface Particle {
  id: number
  position: Vec2
  velocity: Vec2
  life: number
  maxLife: number
  size: number
  color: string
  type: 'drift' | 'nitro'
}

export interface TrackWaypoint {
  x: number
  y: number
  width: number
}

export interface Track {
  waypoints: TrackWaypoint[]
  width: number
  worldSize: number
}

export interface Customization {
  id: string
  color: string
  sticker: StickerType
  unlocked: boolean
}

export type StickerType = 'none' | 'flame' | 'lightning' | 'skull' | 'star'

export const STICKER_TYPES: StickerType[] = ['none', 'flame', 'lightning', 'skull', 'star']

export const BASE_COLORS = [
  '#ffffff',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
]

export interface LapRecord {
  id: string
  time: number
  driftScore: number
  nitroUses: number
  date: string
}

export interface PlayerData {
  id: string
  totalCoins: number
  currentCustomization: Customization
  unlockedColors: string[]
  unlockedStickers: StickerType[]
}

export type GameScreen = 'menu' | 'game' | 'customize' | 'leaderboard'

export type GameStatus = 'ready' | 'racing' | 'paused' | 'finished'

export interface GameStateData {
  status: GameStatus
  lap: number
  lapTime: number
  bestLapTime: number | null
  driftScore: number
  nitroUses: number
  currentWaypointIndex: number
}

export interface InputState {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  space: boolean
}

export interface EngineConfig {
  maxSpeed: number
  acceleration: number
  friction: number
  steerSpeed: number
  maxSteerAngle: number
  driftThreshold: number
  nitroFillRate: number
  nitroBoostMultiplier: number
  nitroDuration: number
  maxParticles: number
  pointsPerDriftSecond: number
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  maxSpeed: 350,
  acceleration: 250,
  friction: 1.2,
  steerSpeed: 3.5,
  maxSteerAngle: 0.6,
  driftThreshold: 0.4,
  nitroFillRate: 25,
  nitroBoostMultiplier: 1.8,
  nitroDuration: 2,
  maxParticles: 100,
  pointsPerDriftSecond: 10,
}
