import * as THREE from 'three'

export interface Particle {
  id: number
  position: THREE.Vector3
  velocity: THREE.Vector3
  color: THREE.Color
  radius: number
  state: ParticleState
  targetPosition?: THREE.Vector3
  trail: THREE.Vector3[]
  isDragging: boolean
}

export type ParticleState = 'normal' | 'selected' | 'dragging' | 'transitioning'

export interface ConstellationTemplate {
  id: string
  name: string
  icon: string
  points: THREE.Vector3[]
}

export interface EngineConfig {
  particleCount: number
  connectionDistance: number
  rotationPeriod: number
  gravityRadius: number
  trailLength: number
  cellSize: number
}

export type DynamicMode = 'free' | 'gravity'

export interface SelectedParticleInfo {
  id: number
  position: { x: number; y: number; z: number }
  kineticEnergy: number
}

export interface StoreState {
  dynamicMode: DynamicMode
  selectedParticle: SelectedParticleInfo | null
  activeConstellation: string | null
  setDynamicMode: (mode: DynamicMode) => void
  setSelectedParticle: (info: SelectedParticleInfo | null) => void
  setActiveConstellation: (id: string | null) => void
  engineRef: any
}
