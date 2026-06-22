import { create } from 'zustand'
import type { WrinkleStats } from './types'
import { exportTextureImage } from './modules/texture/textureEngine'

interface StoreState {
  capturedImage: string | null
  sensitivity: number
  stats: WrinkleStats
  isDownloading: boolean
  setCapturedImage: (image: string | null) => void
  setSensitivity: (value: number) => void
  setStats: (stats: WrinkleStats) => void
  reset: () => void
  triggerDownload: () => Promise<void>
  setIsDownloading: (value: boolean) => void
}

const initialStats: WrinkleStats = {
  averageIntensity: 0,
  maxIntensity: 0,
  maxWrinkleX: 0,
  maxWrinkleY: 0,
}

export const useStore = create<StoreState>((set, get) => ({
  capturedImage: null,
  sensitivity: 50,
  stats: initialStats,
  isDownloading: false,
  setCapturedImage: (image) => set({ capturedImage: image }),
  setSensitivity: (value) => set({ sensitivity: value }),
  setStats: (stats) => set({ stats }),
  setIsDownloading: (value) => set({ isDownloading: value }),
  reset: () => set({ capturedImage: null, stats: initialStats }),
  triggerDownload: async () => {
    const { capturedImage, sensitivity } = get()
    if (!capturedImage) return
    set({ isDownloading: true })
    try {
      const dataUrl = await exportTextureImage(capturedImage, sensitivity, 1024, 768)
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `texture_${Date.now()}.png`
      link.click()
    } finally {
      setTimeout(() => set({ isDownloading: false }), 2000)
    }
  },
}))
