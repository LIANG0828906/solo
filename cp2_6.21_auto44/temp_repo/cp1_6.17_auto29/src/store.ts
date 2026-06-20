import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { AppStore, Layer, CanvasSize, FilterSettings } from './types'
import { CANVAS_SIZES, DEFAULT_FILTER, DEFAULT_TEXT } from './types'

export const useAppStore = create<AppStore>((set, get) => ({
  layers: [],
  selectedLayerId: null,
  canvasSize: CANVAS_SIZES[0],
  uploadProgress: 0,
  isUploading: false,
  isDownloading: false,
  showSuccessToast: false,

  addLayer: (layer: Layer) => {
    set((state) => ({
      layers: [...state.layers, layer],
      selectedLayerId: layer.id,
    }))
  },

  removeLayer: (id: string) => {
    set((state) => {
      const newLayers = state.layers.filter((l) => l.id !== id)
      const selectedIndex = state.layers.findIndex((l) => l.id === id)
      let newSelectedId: string | null = null
      if (newLayers.length > 0) {
        const newIndex = Math.min(selectedIndex, newLayers.length - 1)
        newSelectedId = newLayers[newIndex].id
      }
      return {
        layers: newLayers,
        selectedLayerId: newSelectedId,
      }
    })
  },

  duplicateLayer: (id: string) => {
    set((state) => {
      const index = state.layers.findIndex((l) => l.id === id)
      if (index === -1) return state
      const original = state.layers[index]
      const duplicated: Layer = {
        ...original,
        id: uuidv4(),
        name: `${original.name} 副本`,
        x: original.x + 20,
        y: original.y + 20,
      }
      const newLayers = [...state.layers]
      newLayers.splice(index + 1, 0, duplicated)
      return {
        layers: newLayers,
        selectedLayerId: duplicated.id,
      }
    })
  },

  reorderLayer: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const newLayers = [...state.layers]
      const [removed] = newLayers.splice(fromIndex, 1)
      newLayers.splice(toIndex, 0, removed)
      return { layers: newLayers }
    })
  },

  selectLayer: (id: string | null) => {
    set({ selectedLayerId: id })
  },

  updateLayer: (id: string, updates: Partial<Layer>) => {
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    }))
  },

  setCanvasSize: (size: CanvasSize) => {
    set((state) => {
      const oldSize = state.canvasSize
      const scaleX = size.width / oldSize.width
      const scaleY = size.height / oldSize.height
      const scale = Math.min(scaleX, scaleY)

      const newLayers = state.layers.map((layer) => {
        const newWidth = layer.width * scale
        const newHeight = layer.height * scale
        const newX = (size.width - newWidth) / 2
        const newY = (size.height - newHeight) / 2
        return {
          ...layer,
          width: newWidth,
          height: newHeight,
          x: newX,
          y: newY,
        }
      })

      return {
        canvasSize: size,
        layers: newLayers,
      }
    })
  },

  setUploadProgress: (progress: number) => {
    set({ uploadProgress: progress })
  },

  setIsUploading: (isUploading: boolean) => {
    set({ isUploading })
  },

  setIsDownloading: (isDownloading: boolean) => {
    set({ isDownloading })
  },

  setShowSuccessToast: (show: boolean) => {
    set({ showSuccessToast: show })
  },
}))
