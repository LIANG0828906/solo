import { create } from 'zustand'

export type FractalMode = 'pythagoras' | 'barnsley' | 'lsystem'

export interface FractalParams {
  maxDepth: number
  branchAngle: number
  randomSeed: number
  lengthDecay: number
  growthSpeed: number
}

export interface CameraState {
  rotationX: number
  rotationY: number
  zoom: number
}

export interface RenderState {
  mode: FractalMode
  isTransitioning: boolean
  transitionProgress: number
  currentDepth: number
  branchesGenerated: number
}

export interface FractalStore {
  params: FractalParams
  camera: CameraState
  render: RenderState
  branchTips: Array<{ position: THREE.Vector3; depth: number }>
  setParams: (params: Partial<FractalParams>) => void
  setCamera: (camera: Partial<CameraState>) => void
  setMode: (mode: FractalMode) => void
  cycleMode: () => void
  startTransition: () => void
  endTransition: () => void
  setTransitionProgress: (progress: number) => void
  setCurrentDepth: (depth: number) => void
  incrementBranchesGenerated: (count: number) => void
  setBranchTips: (tips: Array<{ position: THREE.Vector3; depth: number }>) => void
  reset: () => void
}

const MODES: FractalMode[] = ['pythagoras', 'barnsley', 'lsystem']

const defaultParams: FractalParams = {
  maxDepth: 12,
  branchAngle: 30,
  randomSeed: Math.random() * 100,
  lengthDecay: 0.65,
  growthSpeed: 1.0
}

const defaultCamera: CameraState = {
  rotationX: 0.6,
  rotationY: 0,
  zoom: 20
}

const defaultRender: RenderState = {
  mode: 'pythagoras',
  isTransitioning: false,
  transitionProgress: 0,
  currentDepth: 0,
  branchesGenerated: 0
}

export const useFractalStore = create<FractalStore>((set, get) => ({
  params: defaultParams,
  camera: defaultCamera,
  render: defaultRender,
  branchTips: [],

  setParams: (params) => set((state) => ({
    params: { ...state.params, ...params }
  })),

  setCamera: (camera) => set((state) => ({
    camera: { ...state.camera, ...camera }
  })),

  setMode: (mode) => set((state) => ({
    render: { ...state.render, mode }
  })),

  cycleMode: () => {
    const currentIndex = MODES.indexOf(get().render.mode)
    const nextIndex = (currentIndex + 1) % MODES.length
    set((state) => ({
      render: { ...state.render, mode: MODES[nextIndex] }
    }))
  },

  startTransition: () => set((state) => ({
    render: { ...state.render, isTransitioning: true, transitionProgress: 0 }
  })),

  endTransition: () => set((state) => ({
    render: { ...state.render, isTransitioning: false, transitionProgress: 0 }
  })),

  setTransitionProgress: (progress) => set((state) => ({
    render: { ...state.render, transitionProgress: progress }
  })),

  setCurrentDepth: (depth) => set((state) => ({
    render: { ...state.render, currentDepth: depth }
  })),

  incrementBranchesGenerated: (count) => set((state) => ({
    render: { ...state.render, branchesGenerated: state.render.branchesGenerated + count }
  })),

  setBranchTips: (tips) => set({ branchTips: tips }),

  reset: () => set({
    params: { ...defaultParams, randomSeed: Math.random() * 100 },
    render: {
      ...defaultRender,
      mode: get().render.mode,
      currentDepth: 0,
      branchesGenerated: 0
    },
    branchTips: []
  })
}))

export const MODE_NAMES: Record<FractalMode, string> = {
  pythagoras: '毕达哥拉斯树',
  barnsley: 'Barnsley蕨类',
  lsystem: 'L-system变体'
}
