import { create } from 'zustand'
import * as THREE from 'three'

export type PipeType = 'water' | 'power' | 'gas'

export interface Pipe {
  id: string
  type: PipeType
  start: THREE.Vector3
  end: THREE.Vector3
  radius: number
  depth: number
}

export interface CollisionPair {
  pipeA: Pipe
  pipeB: Pipe
  closestPoint: THREE.Vector3
  minDistance: number
}

interface CameraState {
  position: THREE.Vector3
  target: THREE.Vector3
}

interface PipeState {
  pipes: Pipe[]
  collisions: CollisionPair[]
  selectedPipeId: string | null
  hoveredPipeId: string | null
  markersVisible: boolean
  cameraState: CameraState
  addPipe: (pipe: Pipe) => void
  removePipe: (id: string) => void
  setPipes: (pipes: Pipe[]) => void
  setCollisions: (collisions: CollisionPair[]) => void
  setSelectedPipe: (id: string | null) => void
  setHoveredPipe: (id: string | null) => void
  setMarkersVisible: (visible: boolean) => void
  setCameraState: (state: CameraState) => void
}

export const usePipeStore = create<PipeState>((set) => ({
  pipes: [],
  collisions: [],
  selectedPipeId: null,
  hoveredPipeId: null,
  markersVisible: true,
  cameraState: {
    position: new THREE.Vector3(30, 30, 30),
    target: new THREE.Vector3(0, 0, 0)
  },

  addPipe: (pipe) => set((state) => ({ pipes: [...state.pipes, pipe] })),
  removePipe: (id) => set((state) => ({
    pipes: state.pipes.filter(p => p.id !== id)
  })),
  setPipes: (pipes) => set({ pipes }),
  setCollisions: (collisions) => set({ collisions }),
  setSelectedPipe: (id) => set({ selectedPipeId: id }),
  setHoveredPipe: (id) => set({ hoveredPipeId: id }),
  setMarkersVisible: (visible) => set({ markersVisible: visible }),
  setCameraState: (state) => set({ cameraState: state })
}))
