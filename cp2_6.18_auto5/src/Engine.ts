import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type Phase = 'countdown' | 'playing' | 'gameover'

export interface Pulse {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
}

export interface Note {
  id: string
  x: number
  y: number
  rotation: number
  flashPhase: number
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
}

export interface Trail {
  id: string
  x: number
  y: number
  radius: number
  color: string
  life: number
  maxLife: number
}

export interface InputState {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
}

export interface GameState {
  phase: Phase
  countdown: number
  countdownTimer: number
  ball: { x: number; y: number; radius: number }
  safeZone: { radius: number; initialRadius: number; centerX: number; centerY: number }
  pulses: Pulse[]
  notes: Note[]
  particles: Particle[]
  trails: Trail[]
  score: number
  lives: number
  outsideSafeZoneTimer: number
  flashAlpha: number
  flashTimer: number
  blurAmount: number
  blurTimer: number
  whiteFadeAmount: number
  noteSpawnTimer: number
  input: InputState
  canvasWidth: number
  canvasHeight: number
  setInput: (input: Partial<InputState>) => void
  setCanvasSize: (w: number, h: number) => void
  reset: () => void
  update: (deltaTime: number) => void
}

const PULSE_COLORS = ['#FF6B6B', '#48C9B0', '#F39C12']
const WARM_COLORS = ['#FFD700', '#FFA500', '#FF6347', '#FF8C00', '#FF4500']
const INITIAL_SAFE_RADIUS = 300
const SAFE_SHRINK_RATE_PER_FRAME = 0.5
const BALL_SPEED_PER_FRAME = 3
const PULSE_SPEED_PER_FRAME = 2.5
const PULSES_PER_FRAME = 3
const MAX_PULSES = 100
const BALL_RADIUS = 8
const SPATIAL_CELL_SIZE = 40
const COUNTDOWN_SECONDS = 3
const FLASH_DURATION = 0.5
const BLUR_DURATION = 0.8
const WHITE_FADE_DURATION = 0.6
const OUTSIDE_DAMAGE_INTERVAL = 1.0
const TRAIL_LIFETIME = 0.2
const PARTICLE_LIFETIME = 0.3
const NOTE_SPAWN_INTERVAL = 2.0
const MAX_NOTES = 3
const NOTE_FLASH_PERIOD = 1.0
const NOTE_RADIUS_BONUS = 20

function createInitialState(canvasWidth: number, canvasHeight: number) {
  const cx = canvasWidth / 2
  const cy = canvasHeight / 2
  return {
    phase: 'countdown' as Phase,
    countdown: COUNTDOWN_SECONDS,
    countdownTimer: 0,
    ball: { x: cx, y: cy, radius: BALL_RADIUS },
    safeZone: {
      radius: INITIAL_SAFE_RADIUS,
      initialRadius: INITIAL_SAFE_RADIUS,
      centerX: cx,
      centerY: cy,
    },
    pulses: [] as Pulse[],
    notes: [] as Note[],
    particles: [] as Particle[],
    trails: [] as Trail[],
    score: 0,
    lives: 3,
    outsideSafeZoneTimer: 0,
    flashAlpha: 0,
    flashTimer: 0,
    blurAmount: 0,
    blurTimer: 0,
    whiteFadeAmount: 0,
    input: { up: false, down: false, left: false, right: false },
    canvasWidth,
    canvasHeight,
    noteSpawnTimer: 0,
  }
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function dist2(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx
  const dy = ay - by
  return dx * dx + dy * dy
}

function circleCollides(
  ax: number, ay: number, ar: number,
  bx: number, by: number, br: number,
): boolean {
  const r = ar + br
  return dist2(ax, ay, bx, by) <= r * r
}

function spawnPulseAtEdge(state: GameState): Pulse {
  const { canvasWidth: w, canvasHeight: h, safeZone } = state
  const cx = safeZone.centerX
  const cy = safeZone.centerY

  const edge = Math.floor(Math.random() * 4)
  let x: number
  let y: number
  const margin = 20

  switch (edge) {
    case 0:
      x = randomInRange(0, w)
      y = -margin
      break
    case 1:
      x = w + margin
      y = randomInRange(0, h)
      break
    case 2:
      x = randomInRange(0, w)
      y = h + margin
      break
    default:
      x = -margin
      y = randomInRange(0, h)
      break
  }

  const dirX = cx - x
  const dirY = cy - y
  const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1
  const vx = (dirX / len) * PULSE_SPEED_PER_FRAME
  const vy = (dirY / len) * PULSE_SPEED_PER_FRAME
  const radius = randomInRange(6, 16)
  const color = PULSE_COLORS[Math.floor(Math.random() * PULSE_COLORS.length)]
  return { id: uuidv4(), x, y, vx, vy, radius, color }
}

function spawnNoteInSafeZone(state: GameState): Note | null {
  const { centerX, centerY, radius } = state.safeZone
  if (radius < 30) return null
  const r = Math.random() * (radius - 30)
  const angle = Math.random() * Math.PI * 2
  const x = centerX + Math.cos(angle) * r
  const y = centerY + Math.sin(angle) * r
  return { id: uuidv4(), x, y, rotation: 0, flashPhase: Math.random() * Math.PI * 2 }
}

function spawnPickupParticles(x: number, y: number): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + Math.random() * 0.5
    const speed = randomInRange(80, 150)
    particles.push({
      id: uuidv4(),
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: PARTICLE_LIFETIME,
      maxLife: PARTICLE_LIFETIME,
      color: WARM_COLORS[Math.floor(Math.random() * WARM_COLORS.length)],
    })
  }
  return particles
}

function buildSpatialHash(pulses: Pulse[]): Map<string, Pulse[]> {
  const map = new Map<string, Pulse[]>()
  for (const p of pulses) {
    const gx = Math.floor(p.x / SPATIAL_CELL_SIZE)
    const gy = Math.floor(p.y / SPATIAL_CELL_SIZE)
    const key = `${gx},${gy}`
    let arr = map.get(key)
    if (!arr) {
      arr = []
      map.set(key, arr)
    }
    arr.push(p)
  }
  return map
}

function getNearbyPulses(spatial: Map<string, Pulse[]>, x: number, y: number): Pulse[] {
  const gx = Math.floor(x / SPATIAL_CELL_SIZE)
  const gy = Math.floor(y / SPATIAL_CELL_SIZE)
  const result: Pulse[] = []
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const key = `${gx + dx},${gy + dy}`
      const arr = spatial.get(key)
      if (arr) {
        for (const p of arr) {
          result.push(p)
        }
      }
    }
  }
  return result
}

export const useGameStore = create<GameState>((set, get) => ({
  ...createInitialState(window.innerWidth, window.innerHeight),

  setInput: (input: Partial<InputState>) => {
    set((state) => ({ input: { ...state.input, ...input } }))
  },

  setCanvasSize: (w: number, h: number) => {
    set((state) => {
      const cx = w / 2
      const cy = h / 2
      if (state.phase === 'countdown') {
        return {
          canvasWidth: w,
          canvasHeight: h,
          ball: { x: cx, y: cy, radius: BALL_RADIUS },
          safeZone: { ...state.safeZone, centerX: cx, centerY: cy },
        }
      }
      return {
        canvasWidth: w,
        canvasHeight: h,
        safeZone: { ...state.safeZone, centerX: cx, centerY: cy },
      }
    })
  },

  reset: () => {
    const state = get()
    set(createInitialState(state.canvasWidth, state.canvasHeight))
  },

  update: (deltaTime: number) => {
    const state = get()
    const dt = Math.min(deltaTime, 1 / 30)
    const frameFactor = dt * 60

    if (state.phase === 'countdown') {
      const newTimer = state.countdownTimer + dt
      const newCountdown = Math.max(0, COUNTDOWN_SECONDS - Math.floor(newTimer))
      if (newTimer >= COUNTDOWN_SECONDS) {
        set({ phase: 'playing', countdown: 0, countdownTimer: 0, noteSpawnTimer: 0 })
      } else {
        set({ countdownTimer: newTimer, countdown: newCountdown })
      }
      return
    }

    if (state.phase === 'gameover') {
      let changed = false
      const patch: Partial<GameState> = {}

      if (state.flashTimer > 0) {
        const newFlashTimer = Math.max(0, state.flashTimer - dt)
        patch.flashTimer = newFlashTimer
        patch.flashAlpha = newFlashTimer / FLASH_DURATION
        changed = true
      }

      if (state.blurTimer < BLUR_DURATION) {
        const newBlurTimer = Math.min(BLUR_DURATION, state.blurTimer + dt)
        patch.blurTimer = newBlurTimer
        patch.blurAmount = newBlurTimer / BLUR_DURATION
        changed = true
      }

      if (state.blurTimer >= BLUR_DURATION * 0.5 && state.whiteFadeAmount < 1) {
        const whiteProgress = (state.blurTimer - BLUR_DURATION * 0.5) / (BLUR_DURATION * 0.5)
        patch.whiteFadeAmount = Math.min(1, Math.max(0, whiteProgress))
        changed = true
      }

      if (changed) {
        set(patch)
      }
      return
    }

    const { input, safeZone, ball, canvasWidth, canvasHeight } = state

    let newBallX = ball.x
    let newBallY = ball.y
    if (input.left) newBallX -= BALL_SPEED_PER_FRAME * frameFactor
    if (input.right) newBallX += BALL_SPEED_PER_FRAME * frameFactor
    if (input.up) newBallY -= BALL_SPEED_PER_FRAME * frameFactor
    if (input.down) newBallY += BALL_SPEED_PER_FRAME * frameFactor
    newBallX = Math.max(ball.radius, Math.min(canvasWidth - ball.radius, newBallX))
    newBallY = Math.max(ball.radius, Math.min(canvasHeight - ball.radius, newBallY))

    let newSafeRadius = safeZone.radius - SAFE_SHRINK_RATE_PER_FRAME * frameFactor

    let newPulses = [...state.pulses]
    let newTrails = [...state.trails]
    let newParticles = [...state.particles]
    let newNotes = [...state.notes]
    let newScore = state.score
    let newLives = state.lives
    let newFlashAlpha = 0
    let newFlashTimer = 0
    let newBlurAmount = 0
    let newBlurTimer = 0
    let newWhiteFadeAmount = 0
    let newPhase: Phase = 'playing'
    let newOutsideTimer = state.outsideSafeZoneTimer

    const pulsesToAdd = Math.min(PULSES_PER_FRAME, MAX_PULSES - newPulses.length)
    for (let i = 0; i < pulsesToAdd; i++) {
      newPulses.push(spawnPulseAtEdge(state))
    }

    const updatedPulses: Pulse[] = []
    for (const p of newPulses) {
      const nx = p.x + p.vx * frameFactor
      const ny = p.y + p.vy * frameFactor
      const margin = 100
      if (
        nx < -margin || nx > canvasWidth + margin ||
        ny < -margin || ny > canvasHeight + margin
      ) {
        continue
      }
      newTrails.push({
        id: uuidv4(),
        x: p.x,
        y: p.y,
        radius: p.radius,
        color: p.color,
        life: TRAIL_LIFETIME,
        maxLife: TRAIL_LIFETIME,
      })
      updatedPulses.push({ ...p, x: nx, y: ny })
    }
    newPulses = updatedPulses

    newTrails = newTrails
      .map((t) => ({ ...t, life: t.life - dt }))
      .filter((t) => t.life > 0)

    newParticles = newParticles
      .map((p) => ({
        ...p,
        x: p.x + p.vx * dt,
        y: p.y + p.vy * dt,
        life: p.life - dt,
      }))
      .filter((p) => p.life > 0)

    newNotes = newNotes.map((n) => ({
      ...n,
      rotation: n.rotation + dt * 2,
      flashPhase: n.flashPhase + (dt * Math.PI * 2) / NOTE_FLASH_PERIOD,
    }))

    let noteSpawnTimer = state.noteSpawnTimer + dt
    if (noteSpawnTimer >= NOTE_SPAWN_INTERVAL && newNotes.length < MAX_NOTES) {
      noteSpawnTimer = 0
      const noteState: GameState = {
        ...state,
        safeZone: { ...safeZone, radius: Math.max(30, newSafeRadius) },
      }
      const note = spawnNoteInSafeZone(noteState)
      if (note) newNotes.push(note)
    }

    const spatial = buildSpatialHash(newPulses)
    const candidates = getNearbyPulses(spatial, newBallX, newBallY)
    let hitPulse = false
    const collidedPulseIds = new Set<string>()
    for (const p of candidates) {
      if (circleCollides(newBallX, newBallY, ball.radius, p.x, p.y, p.radius)) {
        hitPulse = true
        collidedPulseIds.add(p.id)
      }
    }
    if (collidedPulseIds.size > 0) {
      newPulses = newPulses.filter((p) => !collidedPulseIds.has(p.id))
    }

    const collectedNoteIds = new Set<string>()
    for (const n of newNotes) {
      if (circleCollides(newBallX, newBallY, ball.radius, n.x, n.y, 5)) {
        collectedNoteIds.add(n.id)
        newScore += 10
        newSafeRadius = newSafeRadius + NOTE_RADIUS_BONUS
        newParticles.push(...spawnPickupParticles(n.x, n.y))
      }
    }
    if (collectedNoteIds.size > 0) {
      newNotes = newNotes.filter((n) => !collectedNoteIds.has(n.id))
    }

    newSafeRadius = Math.max(10, Math.min(safeZone.initialRadius + 100, newSafeRadius))

    const ballDistFromCenter = Math.sqrt(
      dist2(newBallX, newBallY, safeZone.centerX, safeZone.centerY),
    )
    if (ballDistFromCenter > newSafeRadius) {
      newOutsideTimer += dt
      if (newOutsideTimer >= OUTSIDE_DAMAGE_INTERVAL) {
        newOutsideTimer = 0
        newLives -= 1
      }
    } else {
      newOutsideTimer = 0
    }

    if (hitPulse) {
      newPhase = 'gameover'
      newFlashAlpha = 1
      newFlashTimer = FLASH_DURATION
    } else if (newLives <= 0) {
      newPhase = 'gameover'
      newFlashAlpha = 1
      newFlashTimer = FLASH_DURATION
    }

    set({
      phase: newPhase,
      ball: { ...ball, x: newBallX, y: newBallY },
      safeZone: { ...safeZone, radius: newSafeRadius },
      pulses: newPulses,
      notes: newNotes,
      particles: newParticles,
      trails: newTrails,
      score: newScore,
      lives: Math.max(0, newLives),
      outsideSafeZoneTimer: newOutsideTimer,
      flashAlpha: newFlashAlpha,
      flashTimer: newFlashTimer,
      blurAmount: newBlurAmount,
      blurTimer: newBlurTimer,
      whiteFadeAmount: newWhiteFadeAmount,
      noteSpawnTimer,
    })
  },
}))
