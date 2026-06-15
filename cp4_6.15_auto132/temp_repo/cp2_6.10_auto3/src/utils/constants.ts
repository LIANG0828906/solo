import type { FanLevelConfig, IncenseType } from '@/types'

export const SCENE_CONSTANTS = {
  ROOM_WIDTH: 10,
  ROOM_HEIGHT: 6,
  ROOM_DEPTH: 10,
  STOVE_POSITION: [0, 0, 0] as [number, number, number],
  FAN_POSITION: [2, 0.5, 0] as [number, number, number],
  SKYLIGHT_RADIUS: 0.5,
  SKYLIGHT_POSITION: [0, 2.9, 0] as [number, number, number],
} as const

export const PARTICLE_CONSTANTS = {
  MAX_PARTICLES: 5000,
  THROTTLE_THRESHOLD: 3000,
  THROTTLE_FACTOR: 0.8,
  PARTICLE_LIFETIME: 6,
  INITIAL_SPEED: 0.2,
  BOUNCE_FACTOR: 0.3,
  MIN_SIZE: 2,
  MAX_SIZE: 6,
  SPAWN_POINTS: 5,
  SPAWN_RATE: 30,
  BUOYANCY: 0.15,
} as const

export const FAN_CONSTANTS: { LEVELS: Record<number, FanLevelConfig>; MIN_ANGLE: number; MAX_ANGLE: number } = {
  LEVELS: {
    0: { speed: 0, amplitude: 0, acceleration: 0 },
    1: { speed: 10, amplitude: 10, acceleration: 0.5 },
    2: { speed: 20, amplitude: 20, acceleration: 1.0 },
    3: { speed: 30, amplitude: 30, acceleration: 2.0 },
  },
  MIN_ANGLE: -45,
  MAX_ANGLE: 45,
} as const

export const INCENSE_COLORS: Record<IncenseType, string> = {
  chenxiang: '#3a2a1a',
  tanxiang: '#4a3a2a',
  longnao: '#e6e6d4',
} as const

export const INCENSE_NAMES: Record<IncenseType, string> = {
  chenxiang: '沉香',
  tanxiang: '檀香',
  longnao: '龙脑',
} as const

export const COLORS = {
  BACKGROUND: '#1a1a1a',
  FLOOR: '#6b5b4b',
  WALL: '#7a8a7a',
  WOOD: '#6b4e3a',
  STOVE_START: '#5d3a1a',
  STOVE_END: '#8b4513',
  FAN_START: '#d4a76a',
  FAN_END: '#c47e3a',
} as const

export const ANIMATION_DURATION = {
  STOVE_LID: 0.2,
  DOOR_WINDOW: 0.3,
  FAN_LEVEL_CHANGE: 0.3,
} as const
