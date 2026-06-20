import { create } from 'zustand'

export type JournalCoverTemplate = 'floral' | 'minimal' | 'vintage' | 'watercolor' | 'leather'

export interface JournalModule {
  id: string
  type: 'text' | 'sticker' | 'drawing' | 'image' | 'checkbox' | 'todo' | 'divider'
  content: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  checked?: boolean
  fontSize?: number
  color?: string
  lineHeight?: number
  zIndex?: number
}

export interface JournalPage {
  id: string
  title: string
  date: string
  modules: JournalModule[]
  bookmarked: boolean
  background: string
}

export interface JournalState {
  title: string
  coverTemplate: JournalCoverTemplate
  pages: JournalPage[]
  currentPageId: string | null
  isExporting: boolean
  exportProgress: number
}

interface HistoryState {
  past: JournalState[]
  present: JournalState
  future: JournalState[]
}

interface JournalActions {
  _commit: (nextState: JournalState) => void
  setTitle: (title: string) => void
  setCoverTemplate: (template: JournalCoverTemplate) => void
  addPage: () => void
  deletePage: (pageId: string) => void
  setCurrentPage: (pageId: string) => void
  updatePageTitle: (pageId: string, title: string) => void
  updatePageBackground: (pageId: string, background: string) => void
  toggleBookmark: (pageId: string) => void
  addModule: (pageId: string, module: Omit<JournalModule, 'id'>) => void
  updateModule: (pageId: string, moduleId: string, updates: Partial<JournalModule>) => void
  deleteModule: (pageId: string, moduleId: string) => void
  reorderModules: (pageId: string, startIndex: number, endIndex: number) => void
  startExport: () => void
  updateExportProgress: (progress: number) => void
  finishExport: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

const generateId = (): string => Math.random().toString(36).slice(2, 11)

const createInitialPage = (): JournalPage => ({
  id: generateId(),
  title: '新页面',
  date: new Date().toISOString().split('T')[0],
  modules: [],
  bookmarked: false,
  background: '#FFFEF7',
})

const createInitialState = (): JournalState => {
  const firstPage = createInitialPage()
  return {
    title: '我的手账本',
    coverTemplate: 'floral',
    pages: [firstPage],
    currentPageId: firstPage.id,
    isExporting: false,
    exportProgress: 0,
  }
}

export const useJournalStore = create<HistoryState & JournalActions>((set, get) => ({
  past: [],
  present: createInitialState(),
  future: [],

  _commit: (nextState: JournalState) => {
    set((state) => ({
      past: [...state.past, state.present],
      present: nextState,
      future: [],
    }))
  },

  setTitle: (title: string) => {
    const { present, _commit } = get()
    _commit({ ...present, title })
  },

  setCoverTemplate: (template: JournalCoverTemplate) => {
    const { present, _commit } = get()
    _commit({ ...present, coverTemplate: template })
  },

  addPage: () => {
    const { present, _commit } = get()
    const newPage = createInitialPage()
    _commit({
      ...present,
      pages: [...present.pages, newPage],
      currentPageId: newPage.id,
    })
  },

  deletePage: (pageId: string) => {
    const { present, _commit } = get()
    if (present.pages.length <= 1) return
    const newPages = present.pages.filter((p) => p.id !== pageId)
    const newCurrentPageId =
      present.currentPageId === pageId
        ? newPages[newPages.length - 1].id
        : present.currentPageId
    _commit({
      ...present,
      pages: newPages,
      currentPageId: newCurrentPageId,
    })
  },

  setCurrentPage: (pageId: string) => {
    set((state) => ({
      present: { ...state.present, currentPageId: pageId },
    }))
  },

  updatePageTitle: (pageId: string, title: string) => {
    const { present, _commit } = get()
    _commit({
      ...present,
      pages: present.pages.map((p) =>
        p.id === pageId ? { ...p, title } : p
      ),
    })
  },

  updatePageBackground: (pageId: string, background: string) => {
    const { present, _commit } = get()
    _commit({
      ...present,
      pages: present.pages.map((p) =>
        p.id === pageId ? { ...p, background } : p
      ),
    })
  },

  toggleBookmark: (pageId: string) => {
    const { present, _commit } = get()
    _commit({
      ...present,
      pages: present.pages.map((p) =>
        p.id === pageId ? { ...p, bookmarked: !p.bookmarked } : p
      ),
    })
  },

  addModule: (pageId: string, module: Omit<JournalModule, 'id'>) => {
    const { present, _commit } = get()
    const newModule: JournalModule = { ...module, id: generateId() }
    _commit({
      ...present,
      pages: present.pages.map((p) =>
        p.id === pageId ? { ...p, modules: [...p.modules, newModule] } : p
      ),
    })
  },

  updateModule: (pageId: string, moduleId: string, updates: Partial<JournalModule>) => {
    const { present, _commit } = get()
    _commit({
      ...present,
      pages: present.pages.map((p) =>
        p.id === pageId
          ? {
              ...p,
              modules: p.modules.map((m) =>
                m.id === moduleId ? { ...m, ...updates } : m
              ),
            }
          : p
      ),
    })
  },

  deleteModule: (pageId: string, moduleId: string) => {
    const { present, _commit } = get()
    _commit({
      ...present,
      pages: present.pages.map((p) =>
        p.id === pageId
          ? { ...p, modules: p.modules.filter((m) => m.id !== moduleId) }
          : p
      ),
    })
  },

  reorderModules: (pageId: string, startIndex: number, endIndex: number) => {
    const { present, _commit } = get()
    _commit({
      ...present,
      pages: present.pages.map((p) => {
        if (p.id !== pageId) return p
        const modules = [...p.modules]
        const [removed] = modules.splice(startIndex, 1)
        modules.splice(endIndex, 0, removed)
        return { ...p, modules }
      }),
    })
  },

  startExport: () => {
    set((state) => ({
      present: { ...state.present, isExporting: true, exportProgress: 0 },
    }))
  },

  updateExportProgress: (progress: number) => {
    set((state) => ({
      present: { ...state.present, exportProgress: progress },
    }))
  },

  finishExport: () => {
    set((state) => ({
      present: { ...state.present, isExporting: false, exportProgress: 0 },
    }))
  },

  undo: () => {
    set((state) => {
      if (state.past.length === 0) return state
      const previous = state.past[state.past.length - 1]
      const newPast = state.past.slice(0, -1)
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      }
    })
  },

  redo: () => {
    set((state) => {
      if (state.future.length === 0) return state
      const next = state.future[0]
      const newFuture = state.future.slice(1)
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
      }
    })
  },

  canUndo: () => get().past.length > 0,

  canRedo: () => get().future.length > 0,
}))

export const initializeKeyboardShortcuts = () => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const isModifier = e.ctrlKey || e.metaKey
    if (!isModifier) return

    if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault()
      useJournalStore.getState().undo()
    } else if (
      (e.key.toLowerCase() === 'z' && e.shiftKey) ||
      e.key.toLowerCase() === 'y'
    ) {
      e.preventDefault()
      useJournalStore.getState().redo()
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}
