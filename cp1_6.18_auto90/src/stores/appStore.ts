import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export type FlavorDimension = 'sweet' | 'sour' | 'bitter' | 'spicy' | 'salty' | 'umami'

export const DIMENSION_COLORS: Record<FlavorDimension, string> = {
  sweet: '#FF9F43',
  sour: '#EE5A24',
  bitter: '#6C5CE7',
  spicy: '#FD79A8',
  salty: '#00CEC9',
  umami: '#FDCB6E',
}

export const DIMENSION_LABELS: Record<FlavorDimension, string> = {
  sweet: '甜',
  sour: '酸',
  bitter: '苦',
  spicy: '辣',
  salty: '咸',
  umami: '鲜',
}

export const DIMENSIONS: FlavorDimension[] = ['sweet', 'sour', 'bitter', 'spicy', 'salty', 'umami']

export interface DominantFlavor {
  dimension: FlavorDimension
  value: number
}

export const getDominantFlavor = (wheel: FlavorWheel): DominantFlavor => {
  let maxDim: FlavorDimension = 'sweet'
  let maxVal = -1
  for (const dim of DIMENSIONS) {
    if (wheel[dim] > maxVal) {
      maxVal = wheel[dim]
      maxDim = dim
    }
  }
  return { dimension: maxDim, value: maxVal }
}

export interface FlavorWheel {
  sweet: number
  sour: number
  bitter: number
  spicy: number
  salty: number
  umami: number
}

export interface TastingNote {
  id: string
  dishName: string
  date: string
  description: string
  photoUrl: string
  wheelData: FlavorWheel
}

export type SortType = 'date-desc' | 'date-asc' | 'sweet' | 'sour' | 'bitter' | 'spicy' | 'salty' | 'umami'

interface AppState {
  currentWheel: FlavorWheel
  notes: TastingNote[]
  sortType: SortType
  selectedNoteId: string | null
  setWheelValue: (dimension: keyof FlavorWheel, value: number) => void
  resetWheel: () => void
  addNote: (note: Omit<TastingNote, 'id'>) => void
  deleteNote: (id: string) => void
  sortNotes: (sortType: SortType) => void
  selectNote: (id: string | null) => void
}

const initialWheel: FlavorWheel = {
  sweet: 0,
  sour: 0,
  bitter: 0,
  spicy: 0,
  salty: 0,
  umami: 0,
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentWheel: initialWheel,
      notes: [],
      sortType: 'date-desc',
      selectedNoteId: null,
      setWheelValue: (dimension, value) =>
        set((state) => ({
          currentWheel: {
            ...state.currentWheel,
            [dimension]: Math.max(0, Math.min(9, value)),
          },
        })),
      resetWheel: () => set({ currentWheel: initialWheel }),
      addNote: (note) => {
        const id = uuidv4()
        set((state) => ({
          notes: [{ ...note, id }, ...state.notes],
        }))
      },
      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        })),
      sortNotes: (sortType) =>
        set((state) => {
          const sortedNotes = [...state.notes].sort((a, b) => {
            if (sortType === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime()
            if (sortType === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime()
            return b.wheelData[sortType as FlavorDimension] - a.wheelData[sortType as FlavorDimension]
          })
          return { notes: sortedNotes, sortType }
        }),
      selectNote: (id) => set({ selectedNoteId: id }),
    }),
    {
      name: 'flavor-wheel-storage',
      partialize: (state) => ({ notes: state.notes }),
    }
  )
)
