import { create } from 'zustand'

export type Lane = 0 | 1 | 2
export type GameState = 'menu' | 'playing' | 'gameover'
export type JudgmentType = 'perfect' | 'good' | 'miss' | null

export interface Obstacle {
  id: number
  lane: Lane
  y: number
  type: 'note' | 'beam' | 'block'
  opacity: number
  color: string
  hit: boolean
}

export interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
  maxLife: number
  size: number
}

export interface Note {
  id: number
  x: number
  y: number
  targetX: number
  targetY: number
  progress: number
  collected: boolean
}

export interface Firework {
  id: number
  x: number
  y: number
  vy: number
  exploded: boolean
  color: string
  particles: Particle[]
}

interface GameStore {
  gameState: GameState
  score: number
  lives: number
  energy: number
  maxEnergy: number
  currentLane: Lane
  speed: number
  baseSpeed: number
  speedMultiplier: number
  maxSpeedMultiplier: number
  obstacles: Obstacle[]
  particles: Particle[]
  notes: Note[]
  fireworks: Firework[]
  beatTime: number
  bpm: number
  beatInterval: number
  lastBeatTime: number
  perfectCount: number
  goodCount: number
  missCount: number
  isClearEffect: boolean
  clearEffectProgress: number
  screenFlash: number
  gameTime: number
  lastSpeedIncrease: number
  playerY: number
  playerVelocityY: number
  isJumping: boolean
  walkFrame: number
  walkTimer: number
  jumpRotation: number
  lastJudgment: JudgmentType
  judgmentTimer: number

  startGame: () => void
  resetGame: () => void
  switchLane: (lane: Lane) => void
  jump: () => void
  releaseEnergy: () => void
  update: (deltaTime: number) => void
}

const LANE_POSITIONS = [-80, 0, 80]
const INITIAL_SPEED = 200
const BEAT_INTERVAL = 0.5
const PLAYER_Y_BASE = 380

let obstacleIdCounter = 0
let particleIdCounter = 0
let noteIdCounter = 0
let fireworkIdCounter = 0

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'menu',
  score: 0,
  lives: 3,
  energy: 0,
  maxEnergy: 5,
  currentLane: 1,
  speed: INITIAL_SPEED,
  baseSpeed: INITIAL_SPEED,
  speedMultiplier: 1,
  maxSpeedMultiplier: 2,
  obstacles: [],
  particles: [],
  notes: [],
  fireworks: [],
  beatTime: 0,
  bpm: 120,
  beatInterval: BEAT_INTERVAL,
  lastBeatTime: 0,
  perfectCount: 0,
  goodCount: 0,
  missCount: 0,
  isClearEffect: false,
  clearEffectProgress: 0,
  screenFlash: 0,
  gameTime: 0,
  lastSpeedIncrease: 0,
  playerY: 0,
  playerVelocityY: 0,
  isJumping: false,
  walkFrame: 0,
  walkTimer: 0,
  jumpRotation: 0,
  lastJudgment: null,
  judgmentTimer: 0,

  startGame: () => {
    get().resetGame()
    set({ gameState: 'playing' })
  },

  resetGame: () => {
    obstacleIdCounter = 0
    particleIdCounter = 0
    noteIdCounter = 0
    fireworkIdCounter = 0
    set({
      gameState: 'menu',
      score: 0,
      lives: 3,
      energy: 0,
      currentLane: 1,
      speed: INITIAL_SPEED,
      baseSpeed: INITIAL_SPEED,
      speedMultiplier: 1,
      obstacles: [],
      particles: [],
      notes: [],
      fireworks: [],
      beatTime: 0,
      lastBeatTime: -BEAT_INTERVAL,
      perfectCount: 0,
      goodCount: 0,
      missCount: 0,
      isClearEffect: false,
      clearEffectProgress: 0,
      screenFlash: 0,
      gameTime: 0,
      lastSpeedIncrease: 0,
      playerY: 0,
      playerVelocityY: 0,
      isJumping: false,
      walkFrame: 0,
      walkTimer: 0,
      jumpRotation: 0,
      lastJudgment: null,
      judgmentTimer: 0,
    })
  },

  switchLane: (lane) => {
    const state = get()
    if (state.gameState !== 'playing') return
    if (lane < 0 || lane > 2) return
    if (lane === state.currentLane) return

    const timeSinceBeat = state.gameTime - state.lastBeatTime
    const beatWindow = 0.15
    const goodWindow = 0.3

    const obstacleInNewLane = state.obstacles.find(
      (o) => o.lane === lane && !o.hit && o.y > PLAYER_Y_BASE - 80 && o.y < PLAYER_Y_BASE + 20
    )

    let judgment: JudgmentType = 'miss'
    let points = 0

    const timeFromNextBeat = state.beatInterval - timeSinceBeat
    const minBeatDiff = Math.min(Math.abs(timeSinceBeat), Math.abs(timeFromNextBeat))

    if (minBeatDiff <= beatWindow) {
      if (!obstacleInNewLane) {
        judgment = 'perfect'
        points = 10
      }
    } else if (minBeatDiff <= goodWindow) {
      if (!obstacleInNewLane) {
        judgment = 'good'
        points = 5
      }
    }

    if (obstacleInNewLane) {
      const newLives = state.lives - 1
      set({
        currentLane: lane,
        lives: newLives,
        lastJudgment: 'miss',
        judgmentTimer: 1,
        speed: state.baseSpeed,
        missCount: state.missCount + 1,
        gameState: newLives <= 0 ? 'gameover' : state.gameState,
        obstacles: state.obstacles.map((o) =>
          o.id === obstacleInNewLane.id ? { ...o, hit: true } : o
        ),
      })
    } else if (judgment === 'perfect') {
      const newEnergy = Math.min(state.energy + 1, state.maxEnergy)
      const playerScreenX = LANE_POSITIONS[state.currentLane]
      const newNote: Note = {
        id: noteIdCounter++,
        x: playerScreenX,
        y: PLAYER_Y_BASE - 20,
        targetX: -250,
        targetY: -200,
        progress: 0,
        collected: false,
      }
      set({
        score: state.score + points,
        energy: newEnergy,
        currentLane: lane,
        lastJudgment: 'perfect',
        judgmentTimer: 1,
        perfectCount: state.perfectCount + 1,
        notes: [...state.notes, newNote],
      })
    } else if (judgment === 'good') {
      set({
        score: state.score + points,
        currentLane: lane,
        lastJudgment: 'good',
        judgmentTimer: 1,
        goodCount: state.goodCount + 1,
      })
    } else {
      set({
        currentLane: lane,
      })
    }
  },

  jump: () => {
    const state = get()
    if (state.gameState !== 'playing') return
    if (state.isJumping) return
    set({
      isJumping: true,
      playerVelocityY: -400,
      jumpRotation: 15,
    })
  },

  releaseEnergy: () => {
    const state = get()
    if (state.gameState !== 'playing') return
    if (state.energy < state.maxEnergy) return

    const newParticles: Particle[] = []
    state.obstacles.forEach((o) => {
      if (!o.hit) {
        for (let i = 0; i < 8; i++) {
          newParticles.push({
            id: particleIdCounter++,
            x: LANE_POSITIONS[o.lane],
            y: o.y,
            vx: (Math.random() - 0.5) * 300,
            vy: (Math.random() - 0.5) * 300,
            color: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'][Math.floor(Math.random() * 6)],
            life: 1,
            maxLife: 1,
            size: 8,
          })
        }
      }
    })

    const newFireworks: Firework[] = []
    for (let i = 0; i < 8; i++) {
      newFireworks.push({
        id: fireworkIdCounter++,
        x: (Math.random() - 0.5) * 500,
        y: 250,
        vy: -250 - Math.random() * 150,
        exploded: false,
        color: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'][Math.floor(Math.random() * 6)],
        particles: [],
      })
    }

    set({
      energy: 0,
      isClearEffect: true,
      clearEffectProgress: 0,
      obstacles: state.obstacles.map((o) => ({ ...o, hit: true })),
      particles: [...state.particles, ...newParticles],
      fireworks: [...state.fireworks, ...newFireworks],
      screenFlash: 1,
    })
  },

  update: (deltaTime) => {
    const state = get()
    if (state.gameState !== 'playing') return

    let newGameTime = state.gameTime + deltaTime
    let newLastSpeedIncrease = state.lastSpeedIncrease
    let newSpeedMultiplier = state.speedMultiplier
    let newBaseSpeed = state.baseSpeed
    let newSpeed = state.speed

    if (newGameTime - newLastSpeedIncrease >= 15) {
      newLastSpeedIncrease = newGameTime
      newSpeedMultiplier = Math.min(newSpeedMultiplier * 1.1, state.maxSpeedMultiplier)
      newBaseSpeed = INITIAL_SPEED * newSpeedMultiplier
      newSpeed = newBaseSpeed
    }

    let newBeatTime = state.beatTime + deltaTime
    let newLastBeatTime = state.lastBeatTime
    let newObstacles = [...state.obstacles]
    let newScreenFlash = state.screenFlash
    let newMissCount = state.missCount
    let newLives = state.lives
    let newGameState: GameState = state.gameState
    let newLastJudgment = state.lastJudgment
    let newJudgmentTimer = state.judgmentTimer

    if (newBeatTime >= state.beatInterval) {
      newBeatTime = 0
      newLastBeatTime = state.gameTime
      newScreenFlash = 0.3

      const lane = Math.floor(Math.random() * 3) as Lane
      const types: Array<'note' | 'beam' | 'block'> = ['note', 'beam', 'block']
      const type = types[Math.floor(Math.random() * types.length)]
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF8C00']
      const color = colors[Math.floor(Math.random() * colors.length)]

      if (newObstacles.length < 40) {
        newObstacles.push({
          id: obstacleIdCounter++,
          lane,
          y: -50,
          type,
          opacity: 0,
          color,
          hit: false,
        })
      }
    }

    newObstacles = newObstacles
      .map((o) => ({
        ...o,
        y: o.y + newSpeed * deltaTime,
        opacity: Math.min(1, o.opacity + deltaTime / 0.2),
      }))
      .filter((o) => o.y < 550)

    const playerY = PLAYER_Y_BASE + state.playerY
    newObstacles.forEach((o) => {
      if (!o.hit && o.lane === state.currentLane && o.y > playerY - 30 && o.y < playerY + 10) {
        o.hit = true
        newLives--
        newMissCount++
        newLastJudgment = 'miss'
        newJudgmentTimer = 1
        newSpeed = newBaseSpeed
        if (newLives <= 0) {
          newGameState = 'gameover'
        }
      }
    })

    let newPlayerY = state.playerY
    let newPlayerVelocityY = state.playerVelocityY
    let newIsJumping = state.isJumping
    let newJumpRotation = state.jumpRotation

    if (newIsJumping) {
      newPlayerVelocityY += 800 * deltaTime
      newPlayerY += newPlayerVelocityY * deltaTime
      if (newPlayerY >= 0) {
        newPlayerY = 0
        newPlayerVelocityY = 0
        newIsJumping = false
        newJumpRotation = 0
      } else {
        newJumpRotation = 15 * (1 - Math.abs(newPlayerY) / 100)
      }
    }

    let newWalkFrame = state.walkFrame
    let newWalkTimer = state.walkTimer
    if (!newIsJumping) {
      newWalkTimer += deltaTime
      if (newWalkTimer >= 0.1) {
        newWalkTimer = 0
        newWalkFrame = (newWalkFrame + 1) % 2
      }
    }

    if (newJudgmentTimer > 0) {
      newJudgmentTimer -= deltaTime
      if (newJudgmentTimer <= 0) {
        newLastJudgment = null
      }
    }

    let newIsClearEffect = state.isClearEffect
    let newClearEffectProgress = state.clearEffectProgress
    if (newIsClearEffect) {
      newClearEffectProgress += deltaTime / 0.3
      if (newClearEffectProgress >= 1) {
        newIsClearEffect = false
        newClearEffectProgress = 0
      }
    }

    if (newScreenFlash > 0) {
      newScreenFlash -= deltaTime
      if (newScreenFlash < 0) newScreenFlash = 0
    }

    let newParticles = [...state.particles]
    newParticles = newParticles
      .map((p) => ({
        ...p,
        x: p.x + p.vx * deltaTime,
        y: p.y + p.vy * deltaTime,
        vy: p.vy + 300 * deltaTime,
        life: p.life - deltaTime,
      }))
      .filter((p) => p.life > 0)

    if (newParticles.length > 20) {
      newParticles = newParticles.slice(-20)
    }

    let newNotes = [...state.notes]
    newNotes = newNotes
      .map((n) => {
        if (n.collected) return n
        const newProgress = n.progress + deltaTime * 1.5
        if (newProgress >= 1) {
          return { ...n, progress: 1, collected: true }
        }
        const t = newProgress
        return {
          ...n,
          progress: newProgress,
          x: n.x + (n.targetX - n.x) * deltaTime * 3,
          y: n.y + (n.targetY - n.y) * deltaTime * 3 - 30 * Math.sin(t * Math.PI),
        }
      })
      .filter((n) => !n.collected)

    let newFireworks = [...state.fireworks]
    newFireworks = newFireworks
      .map((fw) => {
        if (!fw.exploded) {
          const newY = fw.y + fw.vy * deltaTime
          const newVy = fw.vy + 100 * deltaTime
          if (newVy >= 0 || newY <= -200) {
            const fwParticles: Particle[] = []
            for (let i = 0; i < 16; i++) {
              const angle = (i / 16) * Math.PI * 2
              const speed = 100 + Math.random() * 100
              fwParticles.push({
                id: particleIdCounter++,
                x: fw.x,
                y: newY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: fw.color,
                life: 1.5,
                maxLife: 1.5,
                size: 4,
              })
            }
            return { ...fw, y: newY, vy: newVy, exploded: true, particles: fwParticles }
          }
          return { ...fw, y: newY, vy: newVy }
        } else {
          const updatedParticles = fw.particles
            .map((p) => ({
              ...p,
              x: p.x + p.vx * deltaTime,
              y: p.y + p.vy * deltaTime,
              vy: p.vy + 50 * deltaTime,
              life: p.life - deltaTime,
            }))
            .filter((p) => p.life > 0)
          return { ...fw, particles: updatedParticles }
        }
      })
      .filter((fw) => !fw.exploded || fw.particles.length > 0)

    set({
      gameTime: newGameTime,
      lastSpeedIncrease: newLastSpeedIncrease,
      speedMultiplier: newSpeedMultiplier,
      baseSpeed: newBaseSpeed,
      speed: newSpeed,
      beatTime: newBeatTime,
      lastBeatTime: newLastBeatTime,
      obstacles: newObstacles,
      particles: newParticles,
      notes: newNotes,
      fireworks: newFireworks,
      playerY: newPlayerY,
      playerVelocityY: newPlayerVelocityY,
      isJumping: newIsJumping,
      walkFrame: newWalkFrame,
      walkTimer: newWalkTimer,
      jumpRotation: newJumpRotation,
      lastJudgment: newLastJudgment,
      judgmentTimer: newJudgmentTimer,
      isClearEffect: newIsClearEffect,
      clearEffectProgress: newClearEffectProgress,
      screenFlash: newScreenFlash,
      missCount: newMissCount,
      lives: newLives,
      gameState: newGameState,
    })
  },
}))

export { LANE_POSITIONS, INITIAL_SPEED, BEAT_INTERVAL, PLAYER_Y_BASE }
