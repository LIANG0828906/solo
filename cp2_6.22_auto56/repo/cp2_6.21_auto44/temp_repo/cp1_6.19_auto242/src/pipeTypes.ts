export type Direction = 'top' | 'right' | 'bottom' | 'left'

export type PipeType = 'CROSS' | 'ELBOW' | 'STRAIGHT' | 'TEE' | 'START' | 'END'

export const GLOW_COLOR = '#00FFCC'
export const BG_COLOR = '#2A2A3E'
export const PIPE_EMPTY_COLOR = '#4A90D9'
export const ERROR_COLOR = '#FF4444'
export const WIN_COLOR = '#88DDFF'

export interface PipeConfig {
  name: PipeType
  baseConnections: Direction[]
  validRotations: number[]
}

export const PIPE_CONFIGS: Record<PipeType, PipeConfig> = {
  CROSS: {
    name: 'CROSS',
    baseConnections: ['top', 'right', 'bottom', 'left'],
    validRotations: [0],
  },
  ELBOW: {
    name: 'ELBOW',
    baseConnections: ['top', 'right'],
    validRotations: [0, 90, 180, 270],
  },
  STRAIGHT: {
    name: 'STRAIGHT',
    baseConnections: ['top', 'bottom'],
    validRotations: [0, 90],
  },
  TEE: {
    name: 'TEE',
    baseConnections: ['top', 'right', 'bottom'],
    validRotations: [0, 90, 180, 270],
  },
  START: {
    name: 'START',
    baseConnections: ['right'],
    validRotations: [0],
  },
  END: {
    name: 'END',
    baseConnections: ['left'],
    validRotations: [0],
  },
}

export const ROTATION_ANGLES = [0, 90, 180, 270]

const oppositeDirection: Record<Direction, Direction> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

const directionOffset: Record<Direction, { row: number; col: number }> = {
  top: { row: -1, col: 0 },
  bottom: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
}

function rotateDirection(dir: Direction, rotation: number): Direction {
  const directions: Direction[] = ['top', 'right', 'bottom', 'left']
  const idx = directions.indexOf(dir)
  const steps = Math.floor(rotation / 90)
  return directions[(idx + steps) % 4]
}

export function getConnections(type: PipeType, rotation: number): Direction[] {
  const config = PIPE_CONFIGS[type]
  return config.baseConnections.map((dir) => rotateDirection(dir, rotation))
}

export function getOppositeDirection(dir: Direction): Direction {
  return oppositeDirection[dir]
}

export function getDirectionOffset(dir: Direction): { row: number; col: number } {
  return directionOffset[dir]
}

export function getRandomPipeType(): PipeType {
  const types: PipeType[] = ['CROSS', 'ELBOW', 'STRAIGHT', 'TEE']
  return types[Math.floor(Math.random() * types.length)]
}

export function getRandomRotation(): number {
  return ROTATION_ANGLES[Math.floor(Math.random() * ROTATION_ANGLES.length)]
}
