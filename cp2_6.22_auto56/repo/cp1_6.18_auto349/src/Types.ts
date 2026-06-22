export interface GridCell {
  x: number
  y: number
  walls: {
    top: boolean
    right: boolean
    bottom: boolean
    left: boolean
  }
  visited: boolean
  isDeadEnd: boolean
}

export interface Player {
  x: number
  y: number
  radius: number
  speed: number
  pulsePhase: number
}

export interface MemoryFragment {
  gridX: number
  gridY: number
  character: string
  picked: boolean
  pickAnimation: number
}

export interface Footprint {
  x: number
  y: number
  opacity: number
  createdAt: number
}

export interface DisplayCharacter {
  char: string
  rotation: number
  startTime: number
  duration: number
}

export type GameStatus = 'playing' | 'input' | 'won' | 'lost'

export interface GameState {
  status: GameStatus
  timeLeft: number
  grid: GridCell[][]
  player: Player
  fragments: MemoryFragment[]
  pickedSequence: string[]
  footprints: Footprint[]
  currentDisplay: DisplayCharacter | null
  showDialog: boolean
  userInput: string
  failAnimation: number
}

export const GRID_SIZE = 10
export const CELL_SIZE = 40
export const PLAYER_RADIUS = 12
export const PLAYER_SPEED = 3
export const PULSE_PERIOD = 1.2
export const FRAGMENT_SIZE = 24
export const CHARACTER_DISPLAY_DURATION = 2000
export const ROTATION_SPEED = 30
export const INITIAL_TIME = 60
export const FOOTPRINT_RADIUS = 4
export const FOOTPRINT_DURATION = 2500
export const FOOTPRINT_INITIAL_OPACITY = 0.6
export const PICK_ANIMATION_DURATION = 400
export const WALL_COLOR_DEFAULT = '#2E3B4E'
export const WALL_COLOR_HIGHLIGHT = '#4FC3F7'
export const BG_COLOR = '#0D1B2A'
export const TIMER_COLOR = '#D32F2F'
export const HIGHLIGHT_RADIUS = 3
