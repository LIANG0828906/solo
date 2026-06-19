import { create } from 'zustand'

export interface Photo {
  id: string
  dataUrl: string
  timestamp: number
  filterSettings: FilterSettings
}

export interface FilterSettings {
  grainIntensity: number
  colorShift: 'warm' | 'cool'
  vignetteRadius: number
}

interface CameraState {
  photos: Photo[]
  maxPhotos: number
  filterSettings: FilterSettings
  isFlashing: boolean
  captureMode: 'viewfinder' | 'focus'
  zoom: number
  focusDistance: number
  selectedPhoto: Photo | null
  isModalOpen: boolean

  addPhoto: (dataUrl: string, filterSettings: FilterSettings) => void
  setGrainIntensity: (value: number) => void
  setColorShift: (value: 'warm' | 'cool') => void
  setVignetteRadius: (value: number) => void
  setZoom: (value: number) => void
  setFocusDistance: (value: number) => void
  triggerFlash: () => void
  setCaptureMode: (mode: 'viewfinder' | 'focus') => void
  openModal: (photo: Photo) => void
  closeModal: () => void
}

export const useCameraStore = create<CameraState>((set, get) => ({
  photos: [],
  maxPhotos: 6,
  filterSettings: {
    grainIntensity: 40,
    colorShift: 'warm',
    vignetteRadius: 30,
  },
  isFlashing: false,
  captureMode: 'viewfinder',
  zoom: 1,
  focusDistance: 3,
  selectedPhoto: null,
  isModalOpen: false,

  addPhoto: (dataUrl, filterSettings) => {
    const newPhoto: Photo = {
      id: Date.now().toString(),
      dataUrl,
      timestamp: Date.now(),
      filterSettings: { ...filterSettings },
    }
    set((state) => ({
      photos: [newPhoto, ...state.photos].slice(0, state.maxPhotos),
    }))
  },

  setGrainIntensity: (value) =>
    set((state) => ({
      filterSettings: { ...state.filterSettings, grainIntensity: value },
    })),

  setColorShift: (value) =>
    set((state) => ({
      filterSettings: { ...state.filterSettings, colorShift: value },
    })),

  setVignetteRadius: (value) =>
    set((state) => ({
      filterSettings: { ...state.filterSettings, vignetteRadius: value },
    })),

  setZoom: (value) => set({ zoom: Math.max(0.8, Math.min(1.2, value)) }),

  setFocusDistance: (value) =>
    set({ focusDistance: Math.max(0.5, Math.min(100, value)) }),

  triggerFlash: () => {
    set({ isFlashing: true })
    setTimeout(() => set({ isFlashing: false }), 100)
  },

  setCaptureMode: (mode) => set({ captureMode: mode }),

  openModal: (photo) => set({ selectedPhoto: photo, isModalOpen: true }),

  closeModal: () => set({ selectedPhoto: null, isModalOpen: false }),
}))
