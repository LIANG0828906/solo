import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type ElementType = 'text' | 'sticker' | 'drawing'

export interface BaseElement {
  id: string
  type: ElementType
  x: number
  y: number
  zIndex: number
  width: number
  height: number
  rotation: number
  opacity: number
}

export interface TextElement extends BaseElement {
  type: 'text'
  content: string
  fontFamily: string
  fontSize: number
  lineHeight: number
  textAlign: 'left' | 'center' | 'right'
  color: string
  strokeWidth: number
  strokeColor: string
}

export interface StickerElement extends BaseElement {
  type: 'sticker'
  src: string
  scale: number
}

export interface DrawingElement extends BaseElement {
  type: 'drawing'
  fill: string
  stroke: string
  strokeWidth: number
  points: { x: number; y: number }[]
}

export type CanvasElement = TextElement | StickerElement | DrawingElement

interface HistoryEntry {
  elements: CanvasElement[]
  background: string
}

interface EditorState {
  elements: CanvasElement[]
  selectedId: string | null
  canvasSize: { width: number; height: number }
  gridSize: number
  showGrid: boolean
  background: string
  history: HistoryEntry[]
  historyIndex: number
  isDragging: boolean
  activeTool: string | null

  addElement: (element: Partial<CanvasElement> & { type: ElementType }) => string
  selectElement: (id: string | null) => void
  updateElement: (id: string, updates: Partial<CanvasElement>) => void
  deleteElement: (id: string) => void
  reorderElements: (fromId: string, toId: string, placeBefore: boolean) => void
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void
  setBackground: (bg: string) => void
  setIsDragging: (dragging: boolean) => void
  setActiveTool: (tool: string | null) => void
  undo: () => void
  redo: () => void
  pushHistory: () => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  elements: [],
  selectedId: null,
  canvasSize: { width: 600, height: 800 },
  gridSize: 20,
  showGrid: true,
  background: '#ffffff',
  history: [{ elements: [], background: '#ffffff' }],
  historyIndex: 0,
  isDragging: false,
  activeTool: null,

  addElement: (element) => {
    const id = uuidv4()
    const state = get()
    const maxZ = state.elements.length > 0 ? Math.max(...state.elements.map(e => e.zIndex)) : 0

    let newElement: CanvasElement

    if (element.type === 'text') {
      newElement = {
        id,
        type: 'text',
        x: element.x ?? 200,
        y: element.y ?? 300,
        zIndex: maxZ + 1,
        width: element.width ?? 200,
        height: element.height ?? 60,
        rotation: element.rotation ?? 0,
        opacity: element.opacity ?? 1,
        content: (element as Partial<TextElement>).content ?? '双击编辑文字',
        fontFamily: (element as Partial<TextElement>).fontFamily ?? 'Arial',
        fontSize: (element as Partial<TextElement>).fontSize ?? 32,
        lineHeight: (element as Partial<TextElement>).lineHeight ?? 1.4,
        textAlign: (element as Partial<TextElement>).textAlign ?? 'center',
        color: (element as Partial<TextElement>).color ?? '#2d3436',
        strokeWidth: (element as Partial<TextElement>).strokeWidth ?? 0,
        strokeColor: (element as Partial<TextElement>).strokeColor ?? '#000000',
      } as TextElement
    } else if (element.type === 'sticker') {
      newElement = {
        id,
        type: 'sticker',
        x: element.x ?? 250,
        y: element.y ?? 350,
        zIndex: maxZ + 1,
        width: element.width ?? 100,
        height: element.height ?? 100,
        rotation: element.rotation ?? 0,
        opacity: element.opacity ?? 1,
        src: (element as Partial<StickerElement>).src ?? '',
        scale: (element as Partial<StickerElement>).scale ?? 1,
      } as StickerElement
    } else {
      newElement = {
        id,
        type: 'drawing',
        x: element.x ?? 200,
        y: element.y ?? 300,
        zIndex: maxZ + 1,
        width: element.width ?? 200,
        height: element.height ?? 200,
        rotation: element.rotation ?? 0,
        opacity: element.opacity ?? 1,
        fill: (element as Partial<DrawingElement>).fill ?? 'transparent',
        stroke: (element as Partial<DrawingElement>).stroke ?? '#6c5ce7',
        strokeWidth: (element as Partial<DrawingElement>).strokeWidth ?? 3,
        points: (element as Partial<DrawingElement>).points ?? [],
      } as DrawingElement
    }

    set((state) => {
      const newElements = [...state.elements, newElement]
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push({ elements: newElements, background: state.background })
      return {
        elements: newElements,
        selectedId: id,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }
    })
    return id
  },

  selectElement: (id) => set({ selectedId: id }),

  updateElement: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? ({ ...el, ...updates } as CanvasElement) : el
      ),
    }))
  },

  deleteElement: (id) => {
    set((state) => {
      const newElements = state.elements.filter((el) => el.id !== id)
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push({ elements: newElements, background: state.background })
      return {
        elements: newElements,
        selectedId: state.selectedId === id ? null : state.selectedId,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }
    })
  },

  reorderElements: (fromId, toId, placeBefore) => {
    set((state) => {
      const elements = [...state.elements]
      const fromIdx = elements.findIndex((e) => e.id === fromId)
      const toIdx = elements.findIndex((e) => e.id === toId)
      if (fromIdx === -1 || toIdx === -1) return state

      const [removed] = elements.splice(fromIdx, 1)
      const insertIdx = placeBefore ? toIdx : toIdx + 1
      elements.splice(insertIdx, 0, removed)

      const reindexed = elements.map((el, idx) => ({ ...el, zIndex: idx + 1 }))
      return { elements: reindexed }
    })
  },

  bringToFront: (id) => {
    set((state) => {
      const maxZ = Math.max(...state.elements.map((e) => e.zIndex))
      return {
        elements: state.elements.map((el) =>
          el.id === id ? { ...el, zIndex: maxZ + 1 } : el
        ),
      }
    })
  },

  sendToBack: (id) => {
    set((state) => {
      const minZ = Math.min(...state.elements.map((e) => e.zIndex))
      return {
        elements: state.elements.map((el) =>
          el.id === id ? { ...el, zIndex: minZ - 1 } : el
        ),
      }
    })
  },

  setBackground: (bg) => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push({ elements: state.elements, background: bg })
      return {
        background: bg,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }
    })
  },

  setIsDragging: (dragging) => set({ isDragging: dragging }),

  setActiveTool: (tool) => set({ activeTool: tool }),

  undo: () => {
    set((state) => {
      if (state.historyIndex <= 0) return state
      const newIndex = state.historyIndex - 1
      const entry = state.history[newIndex]
      return {
        historyIndex: newIndex,
        elements: entry.elements,
        background: entry.background,
        selectedId: null,
      }
    })
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state
      const newIndex = state.historyIndex + 1
      const entry = state.history[newIndex]
      return {
        historyIndex: newIndex,
        elements: entry.elements,
        background: entry.background,
        selectedId: null,
      }
    })
  },

  pushHistory: () => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push({ elements: state.elements, background: state.background })
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }
    })
  },
}))
