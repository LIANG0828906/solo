import { create } from 'zustand'

export interface AudioFeatures {
  lowFreqEnergy: number
  highFreqEnergy: number
  bpm: number
  beatDetected: boolean
  beatType: 'low' | 'high' | null
  timestamp: number
}

export interface ShipState {
  x: number
  y: number
  targetY: number
  targetX: number
  health: number
  maxHealth: number
  isJumping: boolean
  isDodging: boolean
  manualCooldown: number
  jumpProgress: number
  dodgeProgress: number
  jumpStartY: number
  dodgeStartX: number
}

export interface Meteorite {
  id: number
  x: number
  y: number
  type: 'normal' | 'burning' | 'splitting'
  speed: number
  width: number
  height: number
  rotation: number
  rotationSpeed: number
  splitCount: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  type: 'flame' | 'trail' | 'explosion'
}

export interface Star {
  x: number
  y: number
  radius: number
  baseOpacity: number
  opacity: number
  twinkleSpeed: number
  twinklePhase: number
}

export interface Explosion {
  x: number
  y: number
  life: number
  maxLife: number
}

export interface GameSnapshot {
  ship: ShipState
  meteorites: Meteorite[]
  particles: Particle[]
  stars: Star[]
  explosions: Explosion[]
  score: number
  bpm: number
  maxBpm: number
  survivalTime: number
  isGameOver: boolean
  backgroundColor: string
  spawnInterval: number
  baseSpeed: number
}

export interface ManualTrigger {
  direction: number
  time: number
}

export type GamePhase = 'idle' | 'playing' | 'gameOver'

interface GameStore {
  phase: GamePhase
  finalScore: number
  survivalTime: number
  maxBpm: number
  startGame: () => void
  endGame: (score: number, time: number, bpm: number) => void
  resetGame: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  phase: 'idle',
  finalScore: 0,
  survivalTime: 0,
  maxBpm: 0,
  startGame: () => set({ phase: 'playing', finalScore: 0, survivalTime: 0, maxBpm: 0 }),
  endGame: (score, time, bpm) => set({ phase: 'gameOver', finalScore: score, survivalTime: time, maxBpm: bpm }),
  resetGame: () => set({ phase: 'idle', finalScore: 0, survivalTime: 0, maxBpm: 0 })
}))
