import { create } from 'zustand'
import * as THREE from 'three'

export type ObstacleType = 'building' | 'tower' | 'hill'

export interface Obstacle {
  id: string
  type: ObstacleType
  position: THREE.Vector3
  rotation: THREE.Euler
  size: THREE.Vector3
  radius: number
  selected: boolean
}

export interface ReceiverPoint {
  position: THREE.Vector3
  fieldStrength: number
  pathType: 'direct' | 'reflection' | 'diffraction'
}

export interface RayPath {
  id: string
  points: THREE.Vector3[]
  type: 'direct' | 'reflection' | 'diffraction'
  fieldStrength: number
}

interface AppState {
  sourcePosition: THREE.Vector3
  sourceRotation: THREE.Euler
  power: number
  frequency: number
  permittivity: number
  obstacles: Obstacle[]
  selectedObstacleId: string | null
  rayPaths: RayPath[]
  receiverPoints: ReceiverPoint[]
  fieldStrengthData: { distance: number; strength: number }[]
  isSidebarOpen: boolean

  setSourcePosition: (pos: THREE.Vector3) => void
  setSourceRotation: (rot: THREE.Euler) => void
  setPower: (p: number) => void
  setFrequency: (f: number) => void
  setPermittivity: (p: number) => void
  addObstacle: (obstacle: Obstacle) => void
  updateObstacle: (id: string, updates: Partial<Obstacle>) => void
  removeObstacle: (id: string) => void
  clearObstacles: () => void
  selectObstacle: (id: string | null) => void
  setRayPaths: (paths: RayPath[]) => void
  setReceiverPoints: (points: ReceiverPoint[]) => void
  setFieldStrengthData: (data: { distance: number; strength: number }[]) => void
  loadPreset: () => void
  toggleSidebar: () => void
}

const generateId = () => Math.random().toString(36).substr(2, 9)

const presetObstacles: Obstacle[] = [
  {
    id: 'preset-1',
    type: 'building',
    position: new THREE.Vector3(30, 0, 20),
    rotation: new THREE.Euler(0, 0, 0),
    size: new THREE.Vector3(12, 12, 12),
    radius: 0,
    selected: false,
  },
  {
    id: 'preset-2',
    type: 'tower',
    position: new THREE.Vector3(-20, 0, -15),
    rotation: new THREE.Euler(0, 0, 0),
    size: new THREE.Vector3(4, 18, 4),
    radius: 4,
    selected: false,
  },
  {
    id: 'preset-3',
    type: 'hill',
    position: new THREE.Vector3(10, 0, -30),
    rotation: new THREE.Euler(0, 0, 0),
    size: new THREE.Vector3(12, 12, 12),
    radius: 12,
    selected: false,
  },
]

export const useAppStore = create<AppState>((set, get) => ({
  sourcePosition: new THREE.Vector3(0, 0, 0),
  sourceRotation: new THREE.Euler(0, 0, 0),
  power: 50,
  frequency: 1000,
  permittivity: 4,
  obstacles: [...presetObstacles],
  selectedObstacleId: null,
  rayPaths: [],
  receiverPoints: [],
  fieldStrengthData: [],
  isSidebarOpen: true,

  setSourcePosition: (pos) => set({ sourcePosition: pos }),
  setSourceRotation: (rot) => set({ sourceRotation: rot }),
  setPower: (p) => set({ power: p }),
  setFrequency: (f) => set({ frequency: f }),
  setPermittivity: (p) => set({ permittivity: p }),

  addObstacle: (obstacle) =>
    set((state) => {
      if (state.obstacles.length >= 20) return state
      return { obstacles: [...state.obstacles, obstacle] }
    }),

  updateObstacle: (id, updates) =>
    set((state) => ({
      obstacles: state.obstacles.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      ),
    })),

  removeObstacle: (id) =>
    set((state) => ({
      obstacles: state.obstacles.filter((o) => o.id !== id),
      selectedObstacleId: state.selectedObstacleId === id ? null : state.selectedObstacleId,
    })),

  clearObstacles: () => set({ obstacles: [], selectedObstacleId: null }),

  selectObstacle: (id) =>
    set((state) => ({
      selectedObstacleId: id,
      obstacles: state.obstacles.map((o) => ({
        ...o,
        selected: o.id === id,
      })),
    })),

  setRayPaths: (paths) => set({ rayPaths: paths }),
  setReceiverPoints: (points) => set({ receiverPoints: points }),
  setFieldStrengthData: (data) => set({ fieldStrengthData: data }),

  loadPreset: () =>
    set({
      obstacles: presetObstacles.map((o) => ({ ...o, id: generateId() })),
      selectedObstacleId: null,
    }),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}))

export { generateId }
