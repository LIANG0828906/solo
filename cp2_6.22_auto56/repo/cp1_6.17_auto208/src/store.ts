import { create } from 'zustand'

export interface ImageItem {
  id: string
  url: string
  loaded: boolean
}

interface GalleryState {
  images: ImageItem[]
  currentIndex: number
  scale: number
  rotation: number
  deletedIds: Set<string>
  filterActive: boolean
  translateX: number
  swipeOpacity: number
  transitioning: boolean

  setCurrentIndex: (index: number) => void
  setScale: (scale: number) => void
  setRotation: (rotation: number) => void
  setTranslateX: (x: number) => void
  setSwipeOpacity: (opacity: number) => void
  setTransitioning: (v: boolean) => void
  deleteCurrent: () => void
  toggleFilter: () => void
  addImages: (files: FileList) => void
  markImageLoaded: (id: string) => void
  resetTransform: () => void
}

const sampleImages: ImageItem[] = Array.from({ length: 8 }, (_, i) => ({
  id: `sample-${i}`,
  url: `https://picsum.photos/seed/gallery${i}/800/1200`,
  loaded: false
}))

export const useGalleryStore = create<GalleryState>((set, get) => ({
  images: sampleImages,
  currentIndex: 0,
  scale: 1,
  rotation: 0,
  deletedIds: new Set(),
  filterActive: false,
  translateX: 0,
  swipeOpacity: 1,
  transitioning: false,

  setCurrentIndex: (index) => {
    const visible = get().images.filter(img => !get().deletedIds.has(img.id))
    if (visible.length === 0) {
      set({ currentIndex: 0 })
      return
    }
    const clamped = ((index % visible.length) + visible.length) % visible.length
    set({ currentIndex: clamped })
  },

  setScale: (scale) => set({ scale: Math.max(0.5, Math.min(3, scale)) }),
  setRotation: (rotation) => set({ rotation: Math.max(-45, Math.min(45, rotation)) }),
  setTranslateX: (x) => set({ translateX: x }),
  setSwipeOpacity: (opacity) => set({ swipeOpacity: Math.max(0.8, Math.min(1, opacity)) }),
  setTransitioning: (v) => set({ transitioning: v }),

  deleteCurrent: () => {
    const { images, currentIndex, deletedIds } = get()
    const visible = images.filter(img => !deletedIds.has(img.id))
    if (visible.length === 0) return
    const current = visible[currentIndex]
    const newDeleted = new Set(deletedIds)
    newDeleted.add(current.id)
    const nextVisible = images.filter(img => !newDeleted.has(img.id))
    const newIndex = nextVisible.length === 0
      ? 0
      : Math.min(currentIndex, nextVisible.length - 1)
    set({
      deletedIds: newDeleted,
      currentIndex: newIndex,
      scale: 1,
      rotation: 0,
      translateX: 0,
      swipeOpacity: 1,
      filterActive: false
    })
  },

  toggleFilter: () => set((state) => ({ filterActive: !state.filterActive })),

  addImages: (files) => {
    const newImages: ImageItem[] = Array.from(files).map((file, i) => ({
      id: `local-${Date.now()}-${i}`,
      url: URL.createObjectURL(file),
      loaded: false
    }))
    set((state) => ({
      images: [...state.images, ...newImages],
      currentIndex: state.images.filter(img => !state.deletedIds.has(img.id)).length
    }))
  },

  markImageLoaded: (id) => set((state) => ({
    images: state.images.map(img =>
      img.id === id ? { ...img, loaded: true } : img
    )
  })),

  resetTransform: () => set({ scale: 1, rotation: 0, translateX: 0, swipeOpacity: 1 })
}))

export const getVisibleImages = (state: GalleryState) =>
  state.images.filter(img => !state.deletedIds.has(img.id))
