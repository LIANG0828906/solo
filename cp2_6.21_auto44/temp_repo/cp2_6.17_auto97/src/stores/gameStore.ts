import { create } from 'zustand'

export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover'
export type PlayerAction = 'running' | 'jumping' | 'sliding'
export type JudgeResult = 'perfect' | 'normal' | 'miss'

export interface BeatData {
  time: number
  type: 'block' | 'arch'
}

export interface Obstacle {
  id: string
  type: 'block' | 'arch'
  beatTime: number
  z: number
  judged: boolean
  passed: boolean
}

interface GameState {
  status: GameStatus
  score: number
  combo: number
  maxCombo: number
  health: number
  playerAction: PlayerAction
  playerActionStart: number
  obstacles: Obstacle[]
  gameTime: number
  perfectFlash: boolean
  comboBreakFlash: boolean
  fullscreenFlash: boolean
  perfectFlashTime: number
  comboBreakTime: number
  fullscreenFlashTime: number
  beatIndex: number
  neonPhase: number
  dominantFreq: number

  startGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  resetGame: () => void
  jump: () => void
  slide: () => void
  updateGameTime: (time: number, delta: number) => void
  judgeObstacle: (obstacleId: string, result: JudgeResult) => void
  missObstacle: (obstacleId: string) => void
  setDominantFreq: (freq: number) => void
}

const BPM = 120
const BEAT_INTERVAL = 60000 / BPM
const TOTAL_BEATS = 120
const SONG_DURATION = TOTAL_BEATS * BEAT_INTERVAL

export const PRESET_BEATMAP: BeatData[] = Array.from({ length: TOTAL_BEATS }, (_, i) => ({
  time: 2000 + i * BEAT_INTERVAL,
  type: i % 3 === 0 ? 'arch' : 'block',
}))

export const getSongDuration = () => SONG_DURATION

export const useGameStore = create<GameState>((set, get) => ({
  status: 'idle',
  score: 0,
  combo: 0,
  maxCombo: 0,
  health: 100,
  playerAction: 'running',
  playerActionStart: 0,
  obstacles: [],
  gameTime: 0,
  perfectFlash: false,
  comboBreakFlash: false,
  fullscreenFlash: false,
  perfectFlashTime: 0,
  comboBreakTime: 0,
  fullscreenFlashTime: 0,
  beatIndex: 0,
  neonPhase: 0,
  dominantFreq: 0,

  startGame: () => {
    const initialObstacles: Obstacle[] = PRESET_BEATMAP.map((beat, idx) => ({
      id: `obs-${idx}`,
      type: beat.type,
      beatTime: beat.time,
      z: (beat.time / 1000) * 10,
      judged: false,
      passed: false,
    }))
    set({
      status: 'playing',
      score: 0,
      combo: 0,
      maxCombo: 0,
      health: 100,
      playerAction: 'running',
      playerActionStart: 0,
      obstacles: initialObstacles,
      gameTime: 0,
      perfectFlash: false,
      comboBreakFlash: false,
      fullscreenFlash: false,
      beatIndex: 0,
    })
  },

  pauseGame: () => {
    if (get().status === 'playing') {
      set({ status: 'paused' })
    }
  },

  resumeGame: () => {
    if (get().status === 'paused') {
      set({ status: 'playing' })
    }
  },

  resetGame: () => {
    set({
      status: 'idle',
      score: 0,
      combo: 0,
      maxCombo: 0,
      health: 100,
      playerAction: 'running',
      playerActionStart: 0,
      obstacles: [],
      gameTime: 0,
      perfectFlash: false,
      comboBreakFlash: false,
      fullscreenFlash: false,
      beatIndex: 0,
    })
  },

  jump: () => {
    const state = get()
    if (state.status !== 'playing') return
    if (state.playerAction !== 'running') return
    set({
      playerAction: 'jumping',
      playerActionStart: state.gameTime,
    })
  },

  slide: () => {
    const state = get()
    if (state.status !== 'playing') return
    if (state.playerAction !== 'running') return
    set({
      playerAction: 'sliding',
      playerActionStart: state.gameTime,
    })
  },

  updateGameTime: (time: number, delta: number) => {
    const state = get()
    if (state.status !== 'playing') return

    let newAction = state.playerAction
    const actionDuration = state.playerAction === 'jumping' ? 400 : state.playerAction === 'sliding' ? 300 : 0
    if (state.playerAction !== 'running' && time - state.playerActionStart >= actionDuration) {
      newAction = 'running'
    }

    const newNeonPhase = (state.neonPhase + delta * 2 * Math.PI * (BPM / 60)) % (2 * Math.PI)

    let perfectFlash = state.perfectFlash
    let comboBreakFlash = state.comboBreakFlash
    let fullscreenFlash = state.fullscreenFlash

    if (state.perfectFlash && time - state.perfectFlashTime > 500) perfectFlash = false
    if (state.comboBreakFlash && time - state.comboBreakTime > 300) comboBreakFlash = false
    if (state.fullscreenFlash && time - state.fullscreenFlashTime > 800) fullscreenFlash = false

    set({
      gameTime: time,
      playerAction: newAction,
      neonPhase: newNeonPhase,
      perfectFlash,
      comboBreakFlash,
      fullscreenFlash,
    })

    if (time >= SONG_DURATION + 2000) {
      set({ status: 'gameover' })
    }
  },

  judgeObstacle: (obstacleId: string, result: JudgeResult) => {
    const state = get()
    const obstacle = state.obstacles.find(o => o.id === obstacleId)
    if (!obstacle || obstacle.judged) return

    let newScore = state.score
    let newCombo = state.combo
    let newMaxCombo = state.maxCombo
    let newHealth = state.health
    let perfectFlash = false
    let comboBreakFlash = false
    let fullscreenFlash = state.fullscreenFlash
    let fullscreenFlashTime = state.fullscreenFlashTime
    let perfectFlashTime = state.perfectFlashTime
    let comboBreakTime = state.comboBreakTime

    if (result === 'perfect') {
      newScore += 100
      newCombo += 1
      newMaxCombo = Math.max(newMaxCombo, newCombo)
      perfectFlash = true
      perfectFlashTime = state.gameTime
      if (newCombo > 0 && newCombo % 10 === 0) {
        newScore += 500
        fullscreenFlash = true
        fullscreenFlashTime = state.gameTime
      }
    } else if (result === 'normal') {
      newScore += 50
      if (newCombo > 0) {
        comboBreakFlash = true
        comboBreakTime = state.gameTime
      }
      newCombo = 0
    } else {
      newHealth = Math.max(0, newHealth - 20)
      if (newCombo > 0) {
        comboBreakFlash = true
        comboBreakTime = state.gameTime
      }
      newCombo = 0
    }

    const updatedObstacles = state.obstacles.map(o =>
      o.id === obstacleId ? { ...o, judged: true, passed: true } : o
    )

    const newStatus = newHealth <= 0 ? 'gameover' : state.status

    set({
      score: newScore,
      combo: newCombo,
      maxCombo: newMaxCombo,
      health: newHealth,
      obstacles: updatedObstacles,
      perfectFlash,
      comboBreakFlash,
      fullscreenFlash,
      perfectFlashTime,
      comboBreakTime,
      fullscreenFlashTime,
      status: newStatus,
    })
  },

  missObstacle: (obstacleId: string) => {
    const state = get()
    const obstacle = state.obstacles.find(o => o.id === obstacleId)
    if (!obstacle || obstacle.judged) return
    get().judgeObstacle(obstacleId, 'miss')
  },

  setDominantFreq: (freq: number) => {
    set({ dominantFreq: freq })
  },
}))
