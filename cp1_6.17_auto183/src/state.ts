import { create } from 'zustand'

export interface Note {
  id: string
  lane: number
  y: number
  collected: boolean
  isStrongBeat: boolean
  spawnTime: number
}

export interface Obstacle {
  id: string
  lane: number
  y: number
  hit: boolean
  warningStartTime: number
  spawnTime: number
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

export interface ScorePopup {
  id: string
  x: number
  y: number
  value: number
  life: number
  maxLife: number
}

export type GameState = 'loading' | 'analyzing' | 'ready' | 'playing' | 'paused' | 'gameover'

interface GameStore {
  gameState: GameState
  playerPos: number
  playerJumping: boolean
  score: number
  notes: Note[]
  obstacles: Obstacle[]
  particles: Particle[]
  scorePopups: ScorePopup[]
  beatSyncTime: number
  bpm: number
  difficulty: number
  collectedNotes: number
  isHit: boolean
  screenShake: number
  showLevelUp: boolean
  levelUpTime: number
  beatPulse: number

  setGameState: (state: GameState) => void
  setPlayerPos: (pos: number) => void
  setPlayerJumping: (jumping: boolean) => void
  setScore: (score: number) => void
  addScore: (value: number) => void
  setNotes: (notes: Note[]) => void
  addNote: (note: Note) => void
  removeNote: (id: string) => void
  collectNote: (id: string) => void
  setObstacles: (obstacles: Obstacle[]) => void
  addObstacle: (obstacle: Obstacle) => void
  removeObstacle: (id: string) => void
  hitObstacle: (id: string) => void
  addParticle: (particle: Particle) => void
  removeParticle: (id: string) => void
  addScorePopup: (popup: ScorePopup) => void
  removeScorePopup: (id: string) => void
  setBeatSyncTime: (time: number) => void
  setBpm: (bpm: number) => void
  setDifficulty: (difficulty: number) => void
  incrementDifficulty: () => void
  incrementCollectedNotes: () => void
  setIsHit: (hit: boolean) => void
  setScreenShake: (intensity: number) => void
  setShowLevelUp: (show: boolean) => void
  setLevelUpTime: (time: number) => void
  setBeatPulse: (pulse: number) => void
  resetGame: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: 'loading',
  playerPos: 1,
  playerJumping: false,
  score: 0,
  notes: [],
  obstacles: [],
  particles: [],
  scorePopups: [],
  beatSyncTime: 0,
  bpm: 0,
  difficulty: 1,
  collectedNotes: 0,
  isHit: false,
  screenShake: 0,
  showLevelUp: false,
  levelUpTime: 0,
  beatPulse: 0,

  setGameState: (state) => set({ gameState: state }),
  setPlayerPos: (pos) => set({ playerPos: Math.max(0, Math.min(2, pos)) }),
  setPlayerJumping: (jumping) => set({ playerJumping: jumping }),
  setScore: (score) => set({ score }),
  addScore: (value) => set((state) => ({ score: state.score + value })),
  setNotes: (notes) => set({ notes }),
  addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
  removeNote: (id) => set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),
  collectNote: (id) =>
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, collected: true } : n)),
    })),
  setObstacles: (obstacles) => set({ obstacles }),
  addObstacle: (obstacle) => set((state) => ({ obstacles: [...state.obstacles, obstacle] })),
  removeObstacle: (id) => set((state) => ({ obstacles: state.obstacles.filter((o) => o.id !== id) })),
  hitObstacle: (id) =>
    set((state) => ({
      obstacles: state.obstacles.map((o) => (o.id === id ? { ...o, hit: true } : o)),
    })),
  addParticle: (particle) => set((state) => ({ particles: [...state.particles, particle] })),
  removeParticle: (id) => set((state) => ({ particles: state.particles.filter((p) => p.id !== id) })),
  addScorePopup: (popup) => set((state) => ({ scorePopups: [...state.scorePopups, popup] })),
  removeScorePopup: (id) => set((state) => ({ scorePopups: state.scorePopups.filter((p) => p.id !== id) })),
  setBeatSyncTime: (time) => set({ beatSyncTime: time }),
  setBpm: (bpm) => set({ bpm }),
  setDifficulty: (difficulty) => set({ difficulty: Math.max(1, Math.min(10, difficulty)) }),
  incrementDifficulty: () =>
    set((state) => ({ difficulty: Math.min(10, state.difficulty + 1) })),
  incrementCollectedNotes: () =>
    set((state) => ({ collectedNotes: state.collectedNotes + 1 })),
  setIsHit: (hit) => set({ isHit: hit }),
  setScreenShake: (intensity) => set({ screenShake: intensity }),
  setShowLevelUp: (show) => set({ showLevelUp: show }),
  setLevelUpTime: (time) => set({ levelUpTime: time }),
  setBeatPulse: (pulse) => set({ beatPulse: pulse }),
  resetGame: () =>
    set({
      playerPos: 1,
      playerJumping: false,
      score: 0,
      notes: [],
      obstacles: [],
      particles: [],
      scorePopups: [],
      beatSyncTime: 0,
      difficulty: 1,
      collectedNotes: 0,
      isHit: false,
      screenShake: 0,
      showLevelUp: false,
      levelUpTime: 0,
      beatPulse: 0,
    }),
}))
