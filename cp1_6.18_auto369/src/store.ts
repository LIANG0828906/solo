import { create } from 'zustand'
import { ColorMode, VoxelData, VoxelizationResult, SelectedVoxelInfo } from './types'

interface AppState {
  voxels: VoxelData[]
  visibleLayerCount: number
  maxLayers: number
  colorMode: ColorMode
  monochromeColor: string
  isProcessing: boolean
  selectedVoxel: SelectedVoxelInfo | null
  processingProgress: number
  boundingBox: VoxelizationResult['boundingBox'] | null

  setVoxelizationResult: (result: VoxelizationResult) => void
  setVisibleLayerCount: (count: number) => void
  setColorMode: (mode: ColorMode) => void
  setMonochromeColor: (color: string) => void
  setIsProcessing: (processing: boolean) => void
  setSelectedVoxel: (voxel: SelectedVoxelInfo | null) => void
  setProcessingProgress: (progress: number) => void
  increaseLayer: () => void
  decreaseLayer: () => void
  reset: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  voxels: [],
  visibleLayerCount: 0,
  maxLayers: 0,
  colorMode: 'original',
  monochromeColor: '#FF6B35',
  isProcessing: false,
  selectedVoxel: null,
  processingProgress: 0,
  boundingBox: null,

  setVoxelizationResult: (result) => set({
    voxels: result.voxels,
    maxLayers: result.maxLayers,
    visibleLayerCount: result.maxLayers,
    boundingBox: result.boundingBox,
    selectedVoxel: null,
  }),

  setVisibleLayerCount: (count) => {
    const { maxLayers } = get()
    const clamped = Math.max(0, Math.min(count, maxLayers))
    set({ visibleLayerCount: clamped, selectedVoxel: null })
  },

  setColorMode: (mode) => set({ colorMode: mode }),

  setMonochromeColor: (color) => set({ monochromeColor: color }),

  setIsProcessing: (processing) => set({ isProcessing: processing }),

  setSelectedVoxel: (voxel) => set({ selectedVoxel: voxel }),

  setProcessingProgress: (progress) => set({ processingProgress: progress }),

  increaseLayer: () => {
    const { visibleLayerCount, maxLayers } = get()
    if (visibleLayerCount < maxLayers) {
      set({ visibleLayerCount: visibleLayerCount + 1, selectedVoxel: null })
    }
  },

  decreaseLayer: () => {
    const { visibleLayerCount } = get()
    if (visibleLayerCount > 0) {
      set({ visibleLayerCount: visibleLayerCount - 1, selectedVoxel: null })
    }
  },

  reset: () => set({
    voxels: [],
    visibleLayerCount: 0,
    maxLayers: 0,
    selectedVoxel: null,
    boundingBox: null,
  }),
}))
