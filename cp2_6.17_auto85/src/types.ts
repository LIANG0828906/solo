export enum CipherType {
  CAESAR = 'caesar',
  VIGENERE = 'vigenere',
  AFFINE = 'affine'
}

export interface CipherOption {
  type: CipherType
  name: string
  description: string
}

export interface EncryptionResult {
  plaintext: string
  ciphertext: string
  cipherType: CipherType
  key: string | number
}

export interface ParticleColor {
  r: number
  g: number
  b: number
}

export interface TrailPoint {
  x: number
  y: number
  alpha: number
  size: number
  createdAt: number
}

export interface Particle {
  id: string
  char: string
  x: number
  y: number
  startX: number
  startY: number
  targetX: number
  targetY: number
  size: number
  colorStart: ParticleColor
  colorEnd: ParticleColor
  currentColor: ParticleColor
  progress: number
  duration: number
  startTime: number
  isFlying: boolean
  isReached: boolean
  trail: TrailPoint[]
  trailDuration: number
  rotation: number
  rotationSpeed: number
  bounceStartTime: number
  bounceDuration: number
  bounceAmplitude: number
  isFlashing: boolean
  flashStartTime: number
  flashDuration: number
  curveOffsetX: number
  curveOffsetY: number
  velocityX: number
  velocityY: number
}

export type AnimationDirection = 'encrypt' | 'decrypt'

export interface ParticleState {
  particles: Particle[]
  isAnimating: boolean
  direction: AnimationDirection
  isPaused: boolean
}
