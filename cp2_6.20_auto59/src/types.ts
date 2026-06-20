export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle'

export type LFOTarget = 'volume' | 'pitch' | 'width'

export interface ADSRParams {
  attack: number
  decay: number
  sustain: number
  release: number
}

export interface Note {
  frequency: number
  velocity: number
  startTime: number
  duration: number
}

export interface PathPoint {
  x: number
  y: number
  timestamp: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  alpha: number
}
