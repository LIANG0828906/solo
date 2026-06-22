import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { NoteData, ImageAnnotation } from '../types'
import { eventBus } from './EventBus'

const STORAGE_KEY_NOTES = 'mindmap_notes'

interface NoteState {
  notes: Record<string, NoteData>
  activeNodeId: string | null
}

interface NoteActions {
  loadFromStorage: () => void
  saveToStorage: () => void
  getNote: (nodeId: string) => NoteData | null
  updateNoteContent: (nodeId: string, content: string) => void
  addImage: (nodeId: string, src: string, caption?: string) => ImageAnnotation
  removeImage: (nodeId: string, imageId: string) => void
  updateImageCaption: (nodeId: string, imageId: string, caption: string) => void
  deleteNote: (nodeId: string) => void
  setActiveNode: (nodeId: string | null) => void
}

const loadNotes = (): Record<string, NoteData> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_NOTES)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

export const useNoteStore = create<NoteState & NoteActions>((set, get) => {
  const initialNotes = loadNotes()

  eventBus.on('node:deleted', (nodeId: string) => {
    get().deleteNote(nodeId)
  })

  eventBus.on('node:selected', (nodeId: string | null) => {
    get().setActiveNode(nodeId)
  })

  return {
    notes: initialNotes,
    activeNodeId: null,

    loadFromStorage: () => {
      set({ notes: loadNotes() })
    },

    saveToStorage: () => {
      const { notes } = get()
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes))
    },

    getNote: (nodeId: string) => {
      return get().notes[nodeId] || null
    },

    updateNoteContent: (nodeId: string, content: string) => {
      set((state) => {
        const existing = state.notes[nodeId]
        const note: NoteData = existing
          ? { ...existing, content, updatedAt: Date.now() }
          : {
              nodeId,
              content,
              images: [],
              updatedAt: Date.now(),
            }

        return {
          notes: {
            ...state.notes,
            [nodeId]: note,
          },
        }
      })
      eventBus.emit('note:updated', nodeId)
      get().saveToStorage()
    },

    addImage: (nodeId: string, src: string, caption?: string) => {
      const image: ImageAnnotation = {
        id: uuidv4(),
        src,
        caption,
      }

      set((state) => {
        const existing = state.notes[nodeId]
        const note: NoteData = existing
          ? { ...existing, images: [...existing.images, image], updatedAt: Date.now() }
          : {
              nodeId,
              content: '',
              images: [image],
              updatedAt: Date.now(),
            }

        return {
          notes: {
            ...state.notes,
            [nodeId]: note,
          },
        }
      })

      eventBus.emit('note:imageAdded', nodeId, image)
      get().saveToStorage()
      return image
    },

    removeImage: (nodeId: string, imageId: string) => {
      set((state) => {
        const existing = state.notes[nodeId]
        if (!existing) return state

        return {
          notes: {
            ...state.notes,
            [nodeId]: {
              ...existing,
              images: existing.images.filter((img) => img.id !== imageId),
              updatedAt: Date.now(),
            },
          },
        }
      })
      eventBus.emit('note:imageRemoved', nodeId, imageId)
      get().saveToStorage()
    },

    updateImageCaption: (nodeId: string, imageId: string, caption: string) => {
      set((state) => {
        const existing = state.notes[nodeId]
        if (!existing) return state

        return {
          notes: {
            ...state.notes,
            [nodeId]: {
              ...existing,
              images: existing.images.map((img) =>
                img.id === imageId ? { ...img, caption } : img,
              ),
              updatedAt: Date.now(),
            },
          },
        }
      })
      get().saveToStorage()
    },

    deleteNote: (nodeId: string) => {
      set((state) => {
        const newNotes = { ...state.notes }
        delete newNotes[nodeId]
        return { notes: newNotes }
      })
      eventBus.emit('note:deleted', nodeId)
      get().saveToStorage()
    },

    setActiveNode: (nodeId: string | null) => {
      set({ activeNodeId: nodeId })
    },
  }
})
