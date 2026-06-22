import * as THREE from 'three'

export const PIECE_LENGTH = 40
export const PIECE_WIDTH = 10
export const PIECE_THICKNESS = 10

export const COLORS = {
  vermilion: '#e34234',
  azure: '#1e90ff',
  ochre: '#8b4513',
  gamboge: '#e6a817',
  indigo: '#4b61aa',
  titanium: '#f5f5f5'
} as const

export const PIECE_NAMES = ['天条', '地条', '人条', '发条', '智条', '信条'] as const
export type PieceName = typeof PIECE_NAMES[number]

export const PIECE_COLORS = [
  COLORS.vermilion,
  COLORS.azure,
  COLORS.ochre,
  COLORS.gamboge,
  COLORS.indigo,
  COLORS.titanium
] as const

export interface PieceConfig {
  id: number
  name: PieceName
  color: string
  position: THREE.Vector3
  rotation: THREE.Euler
  axis: THREE.Vector3
  originalSlotPosition: THREE.Vector3
  originalSlotRotation: THREE.Euler
}

const createPieceConfig = (
  id: number,
  position: [number, number, number],
  rotation: [number, number, number],
  axis: [number, number, number]
): PieceConfig => ({
  id,
  name: PIECE_NAMES[id],
  color: PIECE_COLORS[id],
  position: new THREE.Vector3(...position),
  rotation: new THREE.Euler(...rotation.map(r => r * Math.PI / 180)),
  axis: new THREE.Vector3(...axis).normalize(),
  originalSlotPosition: new THREE.Vector3(...position),
  originalSlotRotation: new THREE.Euler(...rotation.map(r => r * Math.PI / 180))
})

export const PIECE_CONFIGS: PieceConfig[] = [
  createPieceConfig(0, [0, 0, 0], [0, 0, 0], [1, 0, 0]),
  createPieceConfig(1, [0, 10, 10], [0, 0, 90], [0, 1, 0]),
  createPieceConfig(2, [10, 0, 10], [90, 0, 0], [0, 0, 1]),
  createPieceConfig(3, [0, -10, -10], [0, 0, -90], [0, 1, 0]),
  createPieceConfig(4, [-10, 0, -10], [-90, 0, 0], [0, 0, 1]),
  createPieceConfig(5, [0, 0, 0], [0, 180, 0], [-1, 0, 0])
]

export const TOLERANCES = {
  SNAP_DISTANCE: 5,
  SNAP_ANGLE: 5 * Math.PI / 180,
  SLOT_ENTRY_DISTANCE: 10,
  SLOT_ENTRY_ANGLE: 3 * Math.PI / 180,
  VALIDATE_DISTANCE: 3,
  VALIDATE_ANGLE: 2 * Math.PI / 180,
  MAX_SLOT_TRANSLATION: 30
} as const

export const LOCK_CENTER = new THREE.Vector3(0, 0, 0)

export const WOOD_GRAIN_PARAMS = {
  color: '#d4a574',
  roughness: 0.8,
  metalness: 0.1
}

export const SCENE_CONFIG = {
  AMBIENT_LIGHT: {
    intensity: 0.4,
    color: '#fff8e7'
  },
  LEFT_LIGHT: {
    intensity: 0.6,
    color: '#ffddaa',
    position: [-20, 30, 20] as [number, number, number]
  },
  RIGHT_LIGHT: {
    intensity: 0.3,
    color: '#ddeeff',
    position: [20, 20, -20] as [number, number, number]
  },
  CAMERA: {
    position: [30, 30, 30] as [number, number, number],
    fov: 50
  },
  WORKBENCH: {
    color: '#5c2e1e',
    width: 120,
    depth: 80,
    height: 4
  },
  BRICK_WALL: {
    color: '#6b6b6b',
    mortarColor: '#3a3a3a',
    mortarWidth: 2
  }
}

export enum LockStatus {
  ASSEMBLED = 'ASSEMBLED',
  DISASSEMBLED = 'DISASSEMBLED',
  IN_PROGRESS = 'IN_PROGRESS'
}

export const PARTICLE_CONFIG = {
  count: 20,
  minSize: 2,
  maxSize: 4,
  color: '#fff3a0',
  life: 1.5,
  spread: 15
}

export const GLOW_CONFIG = {
  color: '#ffcc00',
  intensity: 2.0,
  radius: 12,
  duration: 3000
}
