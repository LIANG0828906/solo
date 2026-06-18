import { create } from 'zustand'

export interface Annotation {
  id: string
  pageIndex: number
  x: number
  y: number
  text: string
  createdAt: number
}

export interface SketchPage {
  id: string
  imageUrl: string
  title: string
}

interface SketchState {
  pages: SketchPage[]
  currentPage: number
  annotations: Annotation[]
  isFlipping: boolean
  flipProgress: number
  flipDirection: 'next' | 'prev' | null
  
  setCurrentPage: (page: number) => void
  addAnnotation: (pageIndex: number, x: number, y: number, text: string) => void
  updateAnnotation: (id: string, text: string) => void
  deleteAnnotation: (id: string) => void
  getAnnotationsByPage: (pageIndex: number) => Annotation[]
  startFlip: (direction: 'next' | 'prev') => void
  setFlipProgress: (progress: number) => void
  endFlip: () => void
}

const generateId = () => Math.random().toString(36).substr(2, 9)

const samplePages: SketchPage[] = [
  { id: '1', imageUrl: 'https://picsum.photos/seed/sketch1/800/1000', title: '森林小径' },
  { id: '2', imageUrl: 'https://picsum.photos/seed/sketch2/800/1000', title: '海边日落' },
  { id: '3', imageUrl: 'https://picsum.photos/seed/sketch3/800/1000', title: '城市街景' },
  { id: '4', imageUrl: 'https://picsum.photos/seed/sketch4/800/1000', title: '山间湖泊' },
  { id: '5', imageUrl: 'https://picsum.photos/seed/sketch5/800/1000', title: '花园一角' },
]

export const useSketchStore = create<SketchState>((set, get) => ({
  pages: samplePages,
  currentPage: 0,
  annotations: [],
  isFlipping: false,
  flipProgress: 0,
  flipDirection: null,

  setCurrentPage: (page: number) => {
    const { pages } = get()
    const clampedPage = Math.max(0, Math.min(pages.length - 1, page))
    set({ currentPage: clampedPage })
  },

  addAnnotation: (pageIndex: number, x: number, y: number, text: string) => {
    const annotation: Annotation = {
      id: generateId(),
      pageIndex,
      x,
      y,
      text,
      createdAt: Date.now(),
    }
    set((state) => ({
      annotations: [...state.annotations, annotation],
    }))
  },

  updateAnnotation: (id: string, text: string) => {
    set((state) => ({
      annotations: state.annotations.map((a) =>
        a.id === id ? { ...a, text } : a
      ),
    }))
  },

  deleteAnnotation: (id: string) => {
    set((state) => ({
      annotations: state.annotations.filter((a) => a.id !== id),
    }))
  },

  getAnnotationsByPage: (pageIndex: number) => {
    return get().annotations.filter((a) => a.pageIndex === pageIndex)
  },

  startFlip: (direction: 'next' | 'prev') => {
    set({ isFlipping: true, flipDirection: direction, flipProgress: 0 })
  },

  setFlipProgress: (progress: number) => {
    set({ flipProgress: progress })
  },

  endFlip: () => {
    const { flipDirection, currentPage, pages } = get()
    let newPage = currentPage
    
    if (flipDirection === 'next' && currentPage < pages.length - 1) {
      newPage = currentPage + 1
    } else if (flipDirection === 'prev' && currentPage > 0) {
      newPage = currentPage - 1
    }
    
    set({ 
      isFlipping: false, 
      flipDirection: null, 
      flipProgress: 0,
      currentPage: newPage 
    })
  },
}))
