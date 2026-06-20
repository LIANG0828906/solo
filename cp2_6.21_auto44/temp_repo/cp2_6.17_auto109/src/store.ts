import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export const NOTE_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#FFE66D',
  '#A29BFE',
  '#FD79A8',
] as const

export type NoteColor = typeof NOTE_COLORS[number]

export interface Note {
  id: string
  x: number
  y: number
  w: number
  h: number
  color: NoteColor
  text: string
  connections: string[]
  zIndex: number
}

interface BoardState {
  past: Note[][]
  present: Note[]
  future: Note[][]
  maxZIndex: number
  selectedNoteId: string | null

  canUndo: boolean
  canRedo: boolean

  _pushHistory: (notes: Note[]) => void
  _commit: (updater: (notes: Note[]) => Note[]) => void

  addNote: (x: number, y: number, color?: NoteColor) => Note
  moveNote: (id: string, x: number, y: number, commitHistory?: boolean) => void
  editNote: (id: string, text: string) => void
  deleteNote: (id: string) => void
  bringToFront: (id: string) => void
  selectNote: (id: string | null) => void
  connectNotes: (id1: string, id2: string) => void
  disconnectNotes: (id1: string, id2: string) => void
  clearAll: () => void
  undo: () => void
  redo: () => void
}

const MAX_HISTORY = 50

function getRandomColor(): NoteColor {
  return NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
}

function deepClone(notes: Note[]): Note[] {
  return notes.map(n => ({ ...n, connections: [...n.connections] }))
}

function removeConnectionsTo(notes: Note[], targetId: string): Note[] {
  return notes.map(n => ({
    ...n,
    connections: n.connections.filter(cid => cid !== targetId),
  }))
}

export const useBoardStore = create<BoardState>((set, get) => ({
  past: [],
  present: [],
  future: [],
  maxZIndex: 0,
  selectedNoteId: null,

  get canUndo() {
    return get().past.length > 0
  },
  get canRedo() {
    return get().future.length > 0
  },

  _pushHistory(notes: Note[]) {
    const { past, present } = get()
    const newPast = [...past, deepClone(present)]
    if (newPast.length > MAX_HISTORY) {
      newPast.shift()
    }
    set({
      past: newPast,
      present: deepClone(notes),
      future: [],
    })
  },

  _commit(updater) {
    const { present } = get()
    const updated = updater(deepClone(present))
    get()._pushHistory(updated)
  },

  addNote(x: number, y: number, color) {
    const newMaxZ = get().maxZIndex + 1
    const note: Note = {
      id: uuidv4(),
      x,
      y,
      w: 160,
      h: 160,
      color: color ?? getRandomColor(),
      text: '',
      connections: [],
      zIndex: newMaxZ,
    }
    get()._commit(notes => [...notes, note])
    set({ maxZIndex: newMaxZ })
    return note
  },

  moveNote(id: string, x: number, y: number, commitHistory = true) {
    if (commitHistory) {
      get()._commit(notes =>
        notes.map(n => (n.id === id ? { ...n, x, y } : n))
      )
    } else {
      set(state => ({
        present: state.present.map(n =>
          n.id === id ? { ...n, x, y } : n
        ),
      }))
    }
  },

  editNote(id: string, text: string) {
    get()._commit(notes =>
      notes.map(n => (n.id === id ? { ...n, text } : n))
    )
  },

  deleteNote(id: string) {
    get()._commit(notes => {
      const filtered = notes.filter(n => n.id !== id)
      return removeConnectionsTo(filtered, id)
    })
  },

  bringToFront(id: string) {
    const newMaxZ = get().maxZIndex + 1
    set(state => ({
      maxZIndex: newMaxZ,
      present: state.present.map(n =>
        n.id === id ? { ...n, zIndex: newMaxZ } : n
      ),
    }))
  },

  selectNote(id: string | null) {
    set({ selectedNoteId: id })
  },

  connectNotes(id1: string, id2: string) {
    if (id1 === id2) return
    get()._commit(notes =>
      notes.map(n => {
        if (n.id === id1 && !n.connections.includes(id2)) {
          return { ...n, connections: [...n.connections, id2] }
        }
        if (n.id === id2 && !n.connections.includes(id1)) {
          return { ...n, connections: [...n.connections, id1] }
        }
        return n
      })
    )
  },

  disconnectNotes(id1: string, id2: string) {
    get()._commit(notes =>
      notes.map(n => {
        if (n.id === id1) {
          return { ...n, connections: n.connections.filter(cid => cid !== id2) }
        }
        if (n.id === id2) {
          return { ...n, connections: n.connections.filter(cid => cid !== id1) }
        }
        return n
      })
    )
  },

  clearAll() {
    get()._commit(() => [])
  },

  undo() {
    const { past, present, future } = get()
    if (past.length === 0) return
    const previous = past[past.length - 1]
    const newPast = past.slice(0, -1)
    set({
      past: newPast,
      present: deepClone(previous),
      future: [deepClone(present), ...future],
    })
  },

  redo() {
    const { past, present, future } = get()
    if (future.length === 0) return
    const next = future[0]
    const newFuture = future.slice(1)
    set({
      past: [...past, deepClone(present)],
      present: deepClone(next),
      future: newFuture,
    })
  },
}))
