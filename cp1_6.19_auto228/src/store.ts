import { create } from 'zustand'
import { SpeechItem, KeywordItem, extractKeywords, generateId } from './utils'

type PlaybackSpeed = 1 | 2 | 3

interface AppState {
  speeches: SpeechItem[]
  keywords: KeywordItem[]
  isPlaying: boolean
  playbackSpeed: PlaybackSpeed
  currentPlayIndex: number
  editingId: string | null
  highlightedId: string | null

  addSpeech: (speaker: string, text: string, timestamp?: number) => void
  updateSpeech: (id: string, updates: Partial<Omit<SpeechItem, 'id'>>) => void
  deleteSpeech: (id: string) => void

  setEditingId: (id: string | null) => void
  setHighlightedId: (id: string | null) => void

  togglePlay: () => void
  setPlaybackSpeed: (speed: PlaybackSpeed) => void
  setCurrentPlayIndex: (index: number) => void

  recalculateKeywords: () => void

  loadFromData: (data: SpeechItem[]) => void
}

const initialSpeeches: SpeechItem[] = []

export const useStore = create<AppState>((set, get) => ({
  speeches: initialSpeeches,
  keywords: [],
  isPlaying: false,
  playbackSpeed: 1,
  currentPlayIndex: -1,
  editingId: null,
  highlightedId: null,

  addSpeech: (speaker, text, timestamp) => {
    const speeches = get().speeches
    const newSpeech: SpeechItem = {
      id: generateId(),
      speaker: speaker || '匿名发言者',
      text: text.slice(0, 500),
      timestamp: timestamp ?? (speeches.length > 0
        ? speeches[speeches.length - 1].timestamp + 30
        : 0),
    }
    const newSpeeches = [...speeches, newSpeech].sort((a, b) => a.timestamp - b.timestamp)
    set({ speeches: newSpeeches })
    get().recalculateKeywords()
  },

  updateSpeech: (id, updates) => {
    const speeches = get().speeches.map(s =>
      s.id === id ? { ...s, ...updates, text: updates.text ? updates.text.slice(0, 500) : s.text } : s
    ).sort((a, b) => a.timestamp - b.timestamp)
    set({ speeches })
    get().recalculateKeywords()
  },

  deleteSpeech: (id) => {
    const speeches = get().speeches.filter(s => s.id !== id)
    set({ speeches })
    get().recalculateKeywords()
  },

  setEditingId: (id) => set({ editingId: id }),
  setHighlightedId: (id) => set({ highlightedId: id }),

  togglePlay: () => set(state => ({ isPlaying: !state.isPlaying })),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setCurrentPlayIndex: (index) => set({ currentPlayIndex: index }),

  recalculateKeywords: () => {
    const start = performance.now()
    const keywords = extractKeywords(get().speeches)
    const elapsed = performance.now() - start
    if (elapsed > 50) {
      console.warn(`Keyword extraction took ${elapsed.toFixed(1)}ms, exceeding 50ms target`)
    }
    set({ keywords })
  },

  loadFromData: (data) => {
    set({ speeches: data.sort((a, b) => a.timestamp - b.timestamp) })
    get().recalculateKeywords()
  }
}))
