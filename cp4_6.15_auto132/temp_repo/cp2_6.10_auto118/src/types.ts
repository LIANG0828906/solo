export type InkType = 'light' | 'medium' | 'dark' | 'burnt' | 'eraser'

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  alpha: number
}

export interface InkDrop {
  id: string
  x: number
  y: number
  type: InkType
  time: number
  particles: Particle[]
  initialRadius: number
  currentRadius: number
  maxRadius: number
  diffusionProgress: number
  diffusionDuration: number
  completed: boolean
  neighbors: string[]
}

export interface PlaybackState {
  isPlaying: boolean
  currentStep: number
  totalSteps: number
  speed: number
}

export interface InkConfig {
  color: string
  name: string
  diffusionSpeed: number
  maxRadiusMultiplier: number
}

export const INK_CONFIGS: Record<Exclude<InkType, 'eraser'>, InkConfig> = {
  light: {
    color: '#ababab',
    name: '淡墨',
    diffusionSpeed: 2.0,
    maxRadiusMultiplier: 5
  },
  medium: {
    color: '#606060',
    name: '中墨',
    diffusionSpeed: 1.5,
    maxRadiusMultiplier: 4
  },
  dark: {
    color: '#1a1a1a',
    name: '浓墨',
    diffusionSpeed: 1.0,
    maxRadiusMultiplier: 3
  },
  burnt: {
    color: '#0d0d0d',
    name: '焦墨',
    diffusionSpeed: 0.8,
    maxRadiusMultiplier: 2.5
  }
}

export const INK_BUTTONS: Array<{ type: InkType; color: string; name: string }> = [
  { type: 'light', color: '#ababab', name: '淡墨' },
  { type: 'medium', color: '#606060', name: '中墨' },
  { type: 'dark', color: '#1a1a1a', name: '浓墨' },
  { type: 'burnt', color: '#0d0d0d', name: '焦墨' },
  { type: 'eraser', color: '#f5e6c8', name: '擦除' }
]
