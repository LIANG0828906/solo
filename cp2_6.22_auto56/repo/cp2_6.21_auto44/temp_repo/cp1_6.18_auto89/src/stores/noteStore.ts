import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type Priority = 'high' | 'medium' | 'low'

export interface Note {
  id: string
  content: string
  color: string
  x: number
  y: number
  priority: Priority
  tags: string[]
  createdAt: number
}

export type SortMode = 'priority' | 'time'

export interface NoteFilter {
  sortMode: SortMode
  tagFilter: string | null
}

const COLORS = [
  '#FFEAA7', '#FFC8C8', '#C8E6C9', '#B3E5FC',
  '#E1BEE7', '#FFD180', '#A5D6A7', '#F8BBD0',
]

const STORAGE_KEY = 'rhythm-notes-data'

function loadFromStorage(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function saveToStorage(notes: Note[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch {}
}

interface NoteStore {
  notes: Note[]
  filter: NoteFilter
  draggingId: string | null

  addNote: () => void
  deleteNote: (id: string) => void
  moveNote: (id: string, x: number, y: number) => void
  updateNoteContent: (id: string, content: string) => void
  updateNotePriority: (id: string, priority: Priority) => void
  updateNoteTags: (id: string, tags: string[]) => void
  setFilter: (filter: Partial<NoteFilter>) => void
  setDraggingId: (id: string | null) => void
  getSortedNotes: () => Note[]
  getFilteredNotes: () => Note[]
  getAllTags: () => string[]
}

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: loadFromStorage(),
  filter: { sortMode: 'time', tagFilter: null },
  draggingId: null,

  addNote: () => {
    const notes = get().notes
    const boardRect = document.getElementById('note-board')?.getBoundingClientRect()
    const maxX = boardRect ? boardRect.width - 220 : 600
    const maxY = boardRect ? boardRect.height - 120 : 480

    const newNote: Note = {
      id: uuidv4(),
      content: '',
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      x: Math.max(0, Math.floor(Math.random() * maxX)),
      y: Math.max(0, Math.floor(Math.random() * maxY)),
      priority: 'medium',
      tags: [],
      createdAt: Date.now(),
    }

    const updated = [...notes, newNote]
    saveToStorage(updated)
    set({ notes: updated })
  },

  deleteNote: (id) => {
    const updated = get().notes.filter((n) => n.id !== id)
    saveToStorage(updated)
    set({ notes: updated })
  },

  moveNote: (id, x, y) => {
    const updated = get().notes.map((n) =>
      n.id === id ? { ...n, x, y } : n
    )
    saveToStorage(updated)
    set({ notes: updated })
  },

  updateNoteContent: (id, content) => {
    const updated = get().notes.map((n) =>
      n.id === id ? { ...n, content } : n
    )
    saveToStorage(updated)
    set({ notes: updated })
  },

  updateNotePriority: (id, priority) => {
    const updated = get().notes.map((n) =>
      n.id === id ? { ...n, priority } : n
    )
    saveToStorage(updated)
    set({ notes: updated })
  },

  updateNoteTags: (id, tags) => {
    const updated = get().notes.map((n) =>
      n.id === id ? { ...n, tags } : n
    )
    saveToStorage(updated)
    set({ notes: updated })
  },

  setFilter: (partial) => {
    set((state) => ({
      filter: { ...state.filter, ...partial },
    }))
  },

  setDraggingId: (id) => {
    set({ draggingId: id })
  },

  getSortedNotes: () => {
    const { notes, filter } = get()
    const sorted = [...notes]
    if (filter.sortMode === 'priority') {
      sorted.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    } else {
      sorted.sort((a, b) => b.createdAt - a.createdAt)
    }
    return sorted
  },

  getFilteredNotes: () => {
    const sorted = get().getSortedNotes()
    const { tagFilter } = get().filter
    if (!tagFilter) return sorted
    return sorted.filter((n) => n.tags.includes(tagFilter))
  },

  getAllTags: () => {
    const tagSet = new Set<string>()
    get().notes.forEach((n) => n.tags.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  },
}))
