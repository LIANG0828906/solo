import { create } from 'zustand'
import { gameTick, generateStars } from './gameLoop'

export type BossPhase = 'idle' | 'chase' | 'charge' | 'summon'

export interface Bullet {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  createdAt: number
}

export interface Minion {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  createdAt: number
}

export interface Star {
  x: number
  y: number
  size: number
  twinkleOffset: number
  twinkleDuration: number
}

export interface ShieldState {
  active: boolean
  startTime: number
  duration: number
}

export interface GameState {
  playerX: number
  playerY: number
  playerSpeed: number
  playerLives: number
  score: number
  shield: ShieldState
  bossX: number
  bossY: number
  bossHp: number
  bossMaxHp: number
  bossPhase: BossPhase
  phaseStartTime: number
  phaseDuration: number
  chargeStartTime: number
  summonCooldown: number
  lastSummonTime: number
  bullets: Bullet[]
  minions: Minion[]
  stars: Star[]
  maxBullets: number
  maxMinions: number
  fps: number
  fpsFrames: number
  fpsLastUpdate: number
  gameWidth: number
  gameHeight: number
  paused: boolean
  gameOver: boolean
  gameOverStartTime: number
  keys: Set<string>
  screenFlash: number
  pulseState: Record<BossPhase, number>
  stateBarProgress: number
  lastFireTime: number
  setGameSize: (w: number, h: number) => void
  setKey: (key: string, pressed: boolean) => void
  resetGame: () => void
  tick: (dt: number, now: number) => void
}

const initialState = {
  playerX: 400,
  playerY: 500,
  playerSpeed: 250,
  playerLives: 3,
  score: 0,
  shield: { active: false, startTime: 0, duration: 300 } as ShieldState,
  bossX: 400,
  bossY: 100,
  bossHp: 100,
  bossMaxHp: 100,
  bossPhase: 'idle' as BossPhase,
  phaseStartTime: 0,
  phaseDuration: 2000,
  chargeStartTime: 0,
  summonCooldown: 10000,
  lastSummonTime: -10000,
  bullets: [] as Bullet[],
  minions: [] as Minion[],
  stars: [] as Star[],
  maxBullets: 100,
  maxMinions: 30,
  fps: 60,
  fpsFrames: 0,
  fpsLastUpdate: 0,
  gameWidth: 800,
  gameHeight: 600,
  paused: false,
  gameOver: false,
  gameOverStartTime: 0,
  keys: new Set<string>(),
  screenFlash: 0,
  pulseState: { idle: 0, chase: 0, charge: 0, summon: 0 } as Record<BossPhase, number>,
  stateBarProgress: 1,
  lastFireTime: 0,
}

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  setGameSize: (w: number, h: number) => {
    set({
      gameWidth: w,
      gameHeight: h,
      stars: generateStars(100, w, h),
      playerY: h - 100,
      playerX: w / 2,
      bossX: w / 2,
      bossY: 100,
      phaseStartTime: performance.now(),
    })
  },

  setKey: (key: string, pressed: boolean) => {
    const keys = new Set(get().keys)
    if (pressed) {
      keys.add(key.toLowerCase())
      if (key === ' ' && !get().shield.active && !get().gameOver && !get().paused) {
        const now = performance.now()
        set({
          shield: { active: true, startTime: now, duration: 300 },
        })
      }
    } else {
      keys.delete(key.toLowerCase())
    }
    set({ keys })
  },

  resetGame: () => {
    const state = get()
    const now = performance.now()
    set({
      playerX: state.gameWidth / 2,
      playerY: state.gameHeight - 100,
      playerLives: 3,
      score: 0,
      shield: { active: false, startTime: 0, duration: 300 },
      bossX: state.gameWidth / 2,
      bossY: 100,
      bossHp: 100,
      bossMaxHp: 100,
      bossPhase: 'idle',
      phaseStartTime: now,
      phaseDuration: 2000,
      chargeStartTime: 0,
      lastSummonTime: -10000,
      bullets: [],
      minions: [],
      paused: false,
      gameOver: false,
      gameOverStartTime: 0,
      screenFlash: 0,
      pulseState: { idle: now, chase: 0, charge: 0, summon: 0 },
      stateBarProgress: 1,
      lastFireTime: 0,
    })
  },

  tick: (dt: number, now: number) => {
    const state = get()
    if (state.paused) return

    if (state.gameOver) {
      if (now - state.gameOverStartTime > 1000) {
        get().resetGame()
      }
      return
    }

    const updates = gameTick(state, dt, now)
    set(updates)
  },
}))

if (typeof window !== 'undefined') {
  ;(window as any).gameStore = useGameStore
}
