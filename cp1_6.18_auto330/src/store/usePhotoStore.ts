import { create } from 'zustand'
import photos, { Photo } from '../data/photos'

export type FlipDirection = 'left' | 'right' | null

export interface FlipState {
  isFlipping: boolean
  direction: FlipDirection
  progress: number
}

export interface ViewMode {
  isFullscreen: boolean
}

interface PhotoStore {
  photos: Photo[]
  currentPageIndex: number
  isCover: boolean
  flipState: FlipState
  viewMode: ViewMode
  preloadedImages: Set<string>

  setCurrentPageIndex: (index: number) => void
  goToCover: () => void
  enterAlbum: () => void
  nextPage: () => void
  prevPage: () => void
  jumpToPage: (index: number) => void
  setFlipState: (state: Partial<FlipState>) => void
  toggleFullscreen: () => void
  exitFullscreen: () => void
  preloadImage: (url: string) => void
  preloadNeighbors: (currentIndex: number, range?: number) => void
}

const sortedPhotos = [...photos].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
)

export const usePhotoStore = create<PhotoStore>((set, get) => ({
  photos: sortedPhotos,
  currentPageIndex: -1,
  isCover: true,
  flipState: {
    isFlipping: false,
    direction: null,
    progress: 0
  },
  viewMode: {
    isFullscreen: false
  },
  preloadedImages: new Set(),

  setCurrentPageIndex: (index) => set({ currentPageIndex: index }),

  goToCover: () => set({ isCover: true, currentPageIndex: -1 }),

  enterAlbum: () => {
    set({ isCover: false, currentPageIndex: 0 })
    get().preloadNeighbors(0)
  },

  nextPage: () => {
    const { currentPageIndex, photos, flipState } = get()
    if (flipState.isFlipping) return
    if (currentPageIndex >= photos.length - 1) return

    set({
      flipState: { isFlipping: true, direction: 'left', progress: 0 }
    })
  },

  prevPage: () => {
    const { currentPageIndex, flipState } = get()
    if (flipState.isFlipping) return
    if (currentPageIndex <= 0) return

    set({
      flipState: { isFlipping: true, direction: 'right', progress: 0 }
    })
  },

  jumpToPage: (index) => {
    const { photos } = get()
    if (index < 0 || index >= photos.length) return
    set({ currentPageIndex: index, flipState: { isFlipping: false, direction: null, progress: 0 } })
    get().preloadNeighbors(index)
  },

  setFlipState: (state) => set((prev) => ({
    flipState: { ...prev.flipState, ...state }
  })),

  toggleFullscreen: () => set((prev) => ({
    viewMode: { isFullscreen: !prev.viewMode.isFullscreen }
  })),

  exitFullscreen: () => set({
    viewMode: { isFullscreen: false }
  }),

  preloadImage: (url) => {
    const { preloadedImages } = get()
    if (preloadedImages.has(url)) return

    const img = new Image()
    img.onload = () => {
      set((prev) => ({
        preloadedImages: new Set(prev.preloadedImages).add(url)
      }))
    }
    img.src = url
  },

  preloadNeighbors: (currentIndex, range = 2) => {
    const { photos, preloadImage } = get()
    const start = Math.max(0, currentIndex - range)
    const end = Math.min(photos.length - 1, currentIndex + range)

    for (let i = start; i <= end; i++) {
      preloadImage(photos[i].imageUrl)
    }
  }
}))
