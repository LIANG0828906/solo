import { create } from 'zustand'
import type { ParsedFile, DiffResponse, StatsResponse, ContextLinesOption } from './types'

interface AppState {
  oldFile: ParsedFile | null
  newFile: ParsedFile | null
  diffResult: DiffResponse | null
  statsResult: StatsResponse | null
  ignoreWhitespace: boolean
  contextLines: ContextLinesOption
  uploadProgress: number
  isUploading: boolean
  isCalculating: boolean
  error: string | null

  setOldFile: (file: ParsedFile | null) => void
  setNewFile: (file: ParsedFile | null) => void
  setDiffResult: (result: DiffResponse | null) => void
  setStatsResult: (result: StatsResponse | null) => void
  setIgnoreWhitespace: (value: boolean) => void
  setContextLines: (value: ContextLinesOption) => void
  setUploadProgress: (value: number | ((prev: number) => number)) => void
  setIsUploading: (value: boolean) => void
  setIsCalculating: (value: boolean) => void
  setError: (error: string | null) => void
  resetAll: () => void
}

export const useAppStore = create<AppState>((set) => ({
  oldFile: null,
  newFile: null,
  diffResult: null,
  statsResult: null,
  ignoreWhitespace: false,
  contextLines: 'all',
  uploadProgress: 0,
  isUploading: false,
  isCalculating: false,
  error: null,

  setOldFile: (file) => set({ oldFile: file }),
  setNewFile: (file) => set({ newFile: file }),
  setDiffResult: (result) => set({ diffResult: result }),
  setStatsResult: (result) => set({ statsResult: result }),
  setIgnoreWhitespace: (value) => set({ ignoreWhitespace: value }),
  setContextLines: (value) => set({ contextLines: value }),
  setUploadProgress: (value) => set((state) => ({ 
    uploadProgress: typeof value === 'function' ? value(state.uploadProgress) : value 
  })),
  setIsUploading: (value) => set({ isUploading: value }),
  setIsCalculating: (value) => set({ isCalculating: value }),
  setError: (error) => set({ error }),
  resetAll: () => set({
    oldFile: null,
    newFile: null,
    diffResult: null,
    statsResult: null,
    ignoreWhitespace: false,
    contextLines: 'all',
    uploadProgress: 0,
    isUploading: false,
    isCalculating: false,
    error: null
  })
}))
