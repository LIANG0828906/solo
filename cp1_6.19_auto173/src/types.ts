export type Rotation = 0 | 90 | 180 | 270

export interface FossilPieceData {
  id: string
  index: number
  targetX: number
  targetY: number
  currentX: number
  currentY: number
  startX: number
  startY: number
  rotation: Rotation
  correctRotation: Rotation
  isPlaced: boolean
  isLocked: boolean
  patternPath: string
  label: string
}

export interface FossilPreset {
  name: string
  era: string
  eraLabel: string
  description: string
  pieces: Omit<FossilPieceData, 'currentX' | 'currentY' | 'startX' | 'startY' | 'rotation' | 'isPlaced' | 'isLocked'>[]
}

export interface GameState {
  pieces: FossilPieceData[]
  score: number
  mistakes: number
  elapsedTime: number
  isComplete: boolean
  startTime: number | null
  hintMode: boolean
  currentFossil: FossilPreset | null
}
