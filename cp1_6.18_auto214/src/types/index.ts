import * as THREE from 'three'

export interface Star {
  id: string
  position: THREE.Vector3
  originalPosition: THREE.Vector3
  brightness: number
  size: number
  pulsePeriod: number
  pulseAmplitude: number
  isSelected: boolean
  isDragging: boolean
  isPartOfConstellation: boolean
  constellationId: string | null
}

export interface Connection {
  id: string
  from: string
  to: string
  isPreview: boolean
  isValid: boolean
  isShaking: boolean
}

export interface ConstellationTemplate {
  id: string
  name: string
  themeColor: string
  starCount: number
  starIds: string[]
  correctOrder: string[]
  story: string
  isUnlocked: boolean
}

export interface Particle {
  id: string
  position: THREE.Vector3
  velocity: THREE.Vector3
  color: string
  size: number
  life: number
  maxLife: number
  opacity: number
}

export interface GameState {
  stars: Star[]
  connections: Connection[]
  constellations: ConstellationTemplate[]
  selectedStarId: string | null
  isDragging: boolean
  draggedStarId: string | null
  unlockedCount: number
  totalConstellations: number
  activeStoryConstellation: ConstellationTemplate | null
  particles: Particle[]
  isResetting: boolean
  constellationStarPositions: Map<string, THREE.Vector3[]>
}

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'SELECT_STAR'; starId: string }
  | { type: 'START_DRAG'; starId: string; position: THREE.Vector3 }
  | { type: 'DRAG_STAR'; starId: string; position: THREE.Vector3 }
  | { type: 'END_DRAG'; starId: string }
  | { type: 'CHECK_CONNECTION'; fromId: string; toId: string }
  | { type: 'UNLOCK_CONSTELLATION'; constellationId: string }
  | { type: 'INVALID_CONNECTION' }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'RESET_GAME' }
  | { type: 'CLOSE_STORY' }
  | { type: 'ADD_PARTICLES'; particles: Particle[] }
  | { type: 'UPDATE_PARTICLES'; particles: Particle[] }
  | { type: 'SHAKE_CONNECTION'; connectionId: string }
  | { type: 'STOP_SHAKE'; connectionId: string }
  | { type: 'SET_CONSTELLATION_POSITIONS'; constellationId: string; positions: THREE.Vector3[] }
