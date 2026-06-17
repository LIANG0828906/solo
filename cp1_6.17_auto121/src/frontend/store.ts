import { create } from 'zustand'

export interface Poem {
  id: number
  title: string
  author: string
  dynasty: string
  genre: string
  lines: number
  content: string[]
}

export interface PoemListItem {
  id: number
  title: string
  author: string
  dynasty: string
  genre: string
  lines: number
  preview: string
}

export type AppMode = 'browse' | 'generate' | 'copy'

export interface CopybookConfig {
  fontSize: number
  gridOpacity: number
  pageMargin: number
}

export interface StrokePoint {
  x: number
  y: number
  pressure: number
  timestamp: number
}

export interface Stroke {
  points: StrokePoint[]
  duration: number
}

interface AppState {
  mode: AppMode
  poems: PoemListItem[]
  selectedPoem: Poem | null
  filters: {
    dynasty: string
    author: string
    genre: string
  }
  filterOptions: {
    dynasties: string[]
    genres: string[]
    authors: string[]
  }
  copybookConfig: CopybookConfig
  currentCharIndex: number
  strokes: Stroke[]
  currentStroke: StrokePoint[]
  isPlaying: boolean
  playbackProgress: number
  similarity: number | null
  isLoading: boolean
  error: string | null

  setMode: (mode: AppMode) => void
  setFilters: (filters: Partial<AppState['filters']>) => void
  setFilterOptions: (options: AppState['filterOptions']) => void
  setPoems: (poems: PoemListItem[]) => void
  setSelectedPoem: (poem: Poem | null) => void
  setCopybookConfig: (config: Partial<CopybookConfig>) => void
  setCurrentCharIndex: (index: number) => void
  addStroke: (stroke: Stroke) => void
  clearStrokes: () => void
  setCurrentStroke: (points: StrokePoint[]) => void
  setIsPlaying: (playing: boolean) => void
  setPlaybackProgress: (progress: number) => void
  setSimilarity: (similarity: number | null) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  resetCopyState: () => void
}

export const useAppStore = create<AppState>((set) => ({
  mode: 'browse',
  poems: [],
  selectedPoem: null,
  filters: {
    dynasty: '',
    author: '',
    genre: '',
  },
  filterOptions: {
    dynasties: [],
    genres: [],
    authors: [],
  },
  copybookConfig: {
    fontSize: 40,
    gridOpacity: 0.5,
    pageMargin: 20,
  },
  currentCharIndex: 0,
  strokes: [],
  currentStroke: [],
  isPlaying: false,
  playbackProgress: 0,
  similarity: null,
  isLoading: false,
  error: null,

  setMode: (mode) => set({ mode }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  setFilterOptions: (options) => set({ filterOptions: options }),
  setPoems: (poems) => set({ poems }),
  setSelectedPoem: (poem) => set({ selectedPoem: poem, currentCharIndex: 0 }),
  setCopybookConfig: (config) =>
    set((state) => ({
      copybookConfig: { ...state.copybookConfig, ...config },
    })),
  setCurrentCharIndex: (index) => set({ currentCharIndex: index }),
  addStroke: (stroke) =>
    set((state) => ({ strokes: [...state.strokes, stroke] })),
  clearStrokes: () => set({ strokes: [], currentStroke: [] }),
  setCurrentStroke: (points) => set({ currentStroke: points }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackProgress: (progress) => set({ playbackProgress: progress }),
  setSimilarity: (similarity) => set({ similarity }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  resetCopyState: () =>
    set({
      currentCharIndex: 0,
      strokes: [],
      currentStroke: [],
      similarity: null,
      isPlaying: false,
      playbackProgress: 0,
    }),
}))
