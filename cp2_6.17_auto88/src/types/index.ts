export type GameStatus = 'START' | 'PLAYING' | 'GAMEOVER'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Platform extends Rect {
  id: string
}

export interface Coin {
  id: string
  x: number
  y: number
  r: number
  collected?: boolean
  collectT?: number
}

export interface Spike extends Rect {
  id: string
  warnT?: number
}

export interface Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  life: number
  maxLife: number
  color: string
}

export interface DashIndicator {
  cooldown: number
  maxCooldown: number
  showT: number
}

export interface InputState {
  jumpPressed: boolean
  dashHeld: boolean
}

export interface TrailFrame {
  x: number
  y: number
  alpha: number
}

export interface SpeedLine {
  x: number
  y: number
  len: number
}

export interface PlayerState {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  onGround: boolean
  dashT: number
  dashCooldown: number
  trail: TrailFrame[]
  speedLines: SpeedLine[]
}

export interface GameState {
  player: PlayerState
  platforms: Platform[]
  coins: Coin[]
  spikes: Spike[]
  particles: Particle[]
  dashIndicator: DashIndicator
  cameraX: number
  score: number
  deathFlash: number
  time: number
  status: GameStatus
  lastFrameMs: number
}

export interface GameActions {
  setStatus: (s: GameStatus) => void
  setScore: (n: number) => void
  startGame: () => void
  endGame: () => void
  resetGame: () => void
}
