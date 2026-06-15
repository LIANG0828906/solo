import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval'
import { v4 as uuidv4 } from 'uuid'

export interface PoemLine {
  id: string
  text: string
  fontFamily: string
  fontSize: number
  color: string
}

export type BackgroundType = 'gradient' | 'image'

export interface Poem {
  id: string
  title: string
  lines: PoemLine[]
  backgroundType: BackgroundType
  gradientColors: string[]
  backgroundImage: string | null
  createdAt: number
  updatedAt: number
}

interface PoemState {
  poems: Poem[]
  currentPoemId: string | null
  isExhibition: boolean
  exhibitionPoemId: string | null
  createPoem: () => Poem
  deletePoem: (id: string) => void
  updatePoem: (id: string, updates: Partial<Poem>) => void
  setCurrentPoemId: (id: string | null) => void
  getCurrentPoem: () => Poem | undefined
  addLine: (poemId: string) => void
  updateLine: (poemId: string, lineId: string, updates: Partial<PoemLine>) => void
  deleteLine: (poemId: string, lineId: string) => void
  startExhibition: (poemId: string) => void
  endExhibition: () => void
}

const FONT_FAMILIES = ['"Ma Shan Zheng"', '"ZCOOL XiaoWei"', '"Long Cang"']

const createDefaultLine = (): PoemLine => ({
  id: uuidv4(),
  text: '',
  fontFamily: FONT_FAMILIES[0],
  fontSize: 24,
  color: '#2C2C2C'
})

const createDefaultPoem = (): Poem => ({
  id: uuidv4(),
  title: '无题',
  lines: [createDefaultLine()],
  backgroundType: 'gradient',
  gradientColors: ['#F5F0EB', '#E8DFD8'],
  backgroundImage: null,
  createdAt: Date.now(),
  updatedAt: Date.now()
})

const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await get(name)
    return value ? String(value) : null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name)
  }
}

export const usePoemStore = create<PoemState>()(
  persist(
    (set, get) => ({
      poems: [],
      currentPoemId: null,
      isExhibition: false,
      exhibitionPoemId: null,

      createPoem: () => {
        const newPoem = createDefaultPoem()
        set(state => ({
          poems: [newPoem, ...state.poems],
          currentPoemId: newPoem.id
        }))
        return newPoem
      },

      deletePoem: (id: string) => {
        set(state => ({
          poems: state.poems.filter(p => p.id !== id),
          currentPoemId: state.currentPoemId === id 
            ? (state.poems.find(p => p.id !== id)?.id || null)
            : state.currentPoemId
        }))
      },

      updatePoem: (id: string, updates: Partial<Poem>) => {
        set(state => ({
          poems: state.poems.map(p =>
            p.id === id 
              ? { ...p, ...updates, updatedAt: Date.now() }
              : p
          )
        }))
      },

      setCurrentPoemId: (id: string | null) => {
        set({ currentPoemId: id })
      },

      getCurrentPoem: () => {
        const { poems, currentPoemId } = get()
        return poems.find(p => p.id === currentPoemId)
      },

      addLine: (poemId: string) => {
        const newLine = createDefaultLine()
        set(state => ({
          poems: state.poems.map(p =>
            p.id === poemId
              ? { ...p, lines: [...p.lines, newLine], updatedAt: Date.now() }
              : p
          )
        }))
      },

      updateLine: (poemId: string, lineId: string, updates: Partial<PoemLine>) => {
        set(state => ({
          poems: state.poems.map(p =>
            p.id === poemId
              ? {
                  ...p,
                  lines: p.lines.map(l =>
                    l.id === lineId ? { ...l, ...updates } : l
                  ),
                  updatedAt: Date.now()
                }
              : p
          )
        }))
      },

      deleteLine: (poemId: string, lineId: string) => {
        set(state => ({
          poems: state.poems.map(p =>
            p.id === poemId
              ? {
                  ...p,
                  lines: p.lines.filter(l => l.id !== lineId),
                  updatedAt: Date.now()
                }
              : p
          )
        }))
      },

      startExhibition: (poemId: string) => {
        set({ isExhibition: true, exhibitionPoemId: poemId })
      },

      endExhibition: () => {
        set({ isExhibition: false, exhibitionPoemId: null })
      }
    }),
    {
      name: 'poem-storage',
      storage: createJSONStorage(() => idbStorage),
      onRehydrateStorage: () => (state) => {
        if (state && state.poems.length === 0) {
          const defaultPoem = createDefaultPoem()
          state.poems = [defaultPoem]
          state.currentPoemId = defaultPoem.id
        }
        if (state && !state.currentPoemId && state.poems.length > 0) {
          state.currentPoemId = state.poems[0].id
        }
      }
    }
  )
)

export const FONT_OPTIONS = [
  { name: '马善政楷', value: '"Ma Shan Zheng"' },
  { name: '站酷小薇', value: '"ZCOOL XiaoWei"' },
  { name: '龙藏体', value: '"Long Cang"' }
]
