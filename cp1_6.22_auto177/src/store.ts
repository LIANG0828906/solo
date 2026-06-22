import { create } from 'zustand'
import type { Note } from './types'

interface AppState {
  notes: Note[]
  filteredNotes: Note[]
  selectedNote: Note | null
  selectedTag: string | null
  searchKeyword: string
  tagCounts: Record<string, number>
  mobileMenuOpen: boolean
  detailOpen: boolean
  loading: boolean

  fetchNotes: () => Promise<void>
  searchNotes: (keyword: string) => Promise<void>
  selectTag: (tag: string | null) => Promise<void>
  selectNote: (id: string) => Promise<void>
  addQuestion: (noteId: string, question: string) => Promise<void>
  toggleMobileMenu: () => void
  setDetailOpen: (open: boolean) => void
}

const API_BASE = '/api'

export const useStore = create<AppState>((set, get) => ({
  notes: [],
  filteredNotes: [],
  selectedNote: null,
  selectedTag: null,
  searchKeyword: '',
  tagCounts: {},
  mobileMenuOpen: false,
  detailOpen: false,
  loading: false,

  fetchNotes: async () => {
    set({ loading: true })
    try {
      const res = await fetch(`${API_BASE}/notes`)
      const data = await res.json()
      set({
        notes: data.notes,
        filteredNotes: data.notes,
        tagCounts: data.tagCounts,
        loading: false,
      })
    } catch {
      set({ loading: false })
    }
  },

  searchNotes: async (keyword: string) => {
    set({ searchKeyword: keyword, loading: true })
    const { selectedTag } = get()
    const params = new URLSearchParams()
    if (keyword) params.set('search', keyword)
    if (selectedTag) params.set('tag', selectedTag)
    try {
      const res = await fetch(`${API_BASE}/notes?${params}`)
      const data = await res.json()
      set({ filteredNotes: data.notes, tagCounts: data.tagCounts, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  selectTag: async (tag: string | null) => {
    set({ selectedTag: tag, loading: true })
    const { searchKeyword } = get()
    const params = new URLSearchParams()
    if (searchKeyword) params.set('search', searchKeyword)
    if (tag) params.set('tag', tag)
    try {
      const res = await fetch(`${API_BASE}/notes?${params}`)
      const data = await res.json()
      set({ filteredNotes: data.notes, tagCounts: data.tagCounts, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  selectNote: async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/notes/${id}`)
      const data = await res.json()
      set({ selectedNote: data.note, detailOpen: true })
    } catch {
      // ignore
    }
  },

  addQuestion: async (noteId: string, question: string) => {
    try {
      const res = await fetch(`${API_BASE}/notes/${noteId}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const qa = await res.json()
      const { selectedNote } = get()
      if (selectedNote && selectedNote.id === noteId) {
        set({
          selectedNote: {
            ...selectedNote,
            qa: [...selectedNote.qa, qa],
          },
        })
      }
    } catch {
      // ignore
    }
  },

  toggleMobileMenu: () =>
    set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),
  setDetailOpen: (open: boolean) => set({ detailOpen: open }),
}))
