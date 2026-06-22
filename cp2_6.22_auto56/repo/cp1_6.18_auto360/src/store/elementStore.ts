import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export interface BaseElement {
  id: string
  type: 'text' | 'sticker' | 'brush'
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

export interface TextElement extends BaseElement {
  type: 'text'
  content: string
  fontSize: number
  fontFamily: string
  color: string
  bold: boolean
  italic: boolean
  underline: boolean
}

export interface StickerElement extends BaseElement {
  type: 'sticker'
  stickerType: string
}

export interface BrushElement extends BaseElement {
  type: 'brush'
  points: { x: number; y: number }[]
  strokeWidth: number
  strokeColor: string
}

export type PostcardElement = TextElement | StickerElement | BrushElement

export type ToolType = 'select' | 'text' | 'sticker' | 'brush'
export type TextureType = 'plain' | 'grid' | 'watercolor' | 'vintage' | 'kraft'

export interface ElementState {
  elements: PostcardElement[]
  selectedId: string | null
  backgroundTexture: TextureType
  currentTool: ToolType
  brushColor: string
  brushWidth: number
  showStickerPanel: boolean
  editingTextId: string | null
  history: PostcardElement[][]
  historyIndex: number

  selectElement: (id: string | null) => void
  setTool: (tool: ToolType) => void
  setTexture: (texture: TextureType) => void
  setBrushColor: (color: string) => void
  setBrushWidth: (width: number) => void
  setShowStickerPanel: (show: boolean) => void
  setEditingTextId: (id: string | null) => void

  addTextElement: (x: number, y: number) => void
  addStickerElement: (stickerType: string) => void
  startBrushStroke: (x: number, y: number) => void
  continueBrushStroke: (x: number, y: number) => void
  finishBrushStroke: () => void

  updateElement: (id: string, updates: Partial<PostcardElement>) => void
  deleteElement: (id: string) => void

  pushHistory: () => void
  undo: () => void
  redo: () => void
}

export const useElementStore = create<ElementState>((set, get) => ({
  elements: [],
  selectedId: null,
  backgroundTexture: 'plain',
  currentTool: 'select',
  brushColor: '#333333',
  brushWidth: 3,
  showStickerPanel: false,
  editingTextId: null,
  history: [[]],
  historyIndex: 0,

  selectElement: (id) => set({ selectedId: id, editingTextId: null }),
  setTool: (tool) => {
    const updates: Partial<ElementState> = { currentTool: tool, selectedId: null }
    if (tool === 'sticker') {
      updates.showStickerPanel = true
    }
    set(updates)
  },
  setTexture: (texture) => set({ backgroundTexture: texture }),
  setBrushColor: (color) => set({ brushColor: color }),
  setBrushWidth: (width) => set({ brushWidth: width }),
  setShowStickerPanel: (show) => set({ showStickerPanel: show }),
  setEditingTextId: (id) => set({ editingTextId: id }),

  addTextElement: (x, y) => {
    const state = get()
    state.pushHistory()
    const el: TextElement = {
      id: uuidv4(),
      type: 'text',
      x,
      y,
      width: 240,
      height: 40,
      rotation: 0,
      content: '双击编辑文字',
      fontSize: 24,
      fontFamily: 'Georgia',
      color: '#333333',
      bold: false,
      italic: false,
      underline: false,
    }
    set({
      elements: [...get().elements, el],
      selectedId: el.id,
      editingTextId: el.id,
      currentTool: 'select',
    })
  },

  addStickerElement: (stickerType) => {
    const state = get()
    state.pushHistory()
    const el: StickerElement = {
      id: uuidv4(),
      type: 'sticker',
      stickerType,
      x: 400 - 60,
      y: 300 - 60,
      width: 120,
      height: 120,
      rotation: 0,
    }
    set({
      elements: [...get().elements, el],
      selectedId: el.id,
      showStickerPanel: false,
      currentTool: 'select',
    })
  },

  startBrushStroke: (x, y) => {
    const state = get()
    state.pushHistory()
    const el: BrushElement = {
      id: uuidv4(),
      type: 'brush',
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      rotation: 0,
      points: [{ x, y }],
      strokeWidth: state.brushWidth,
      strokeColor: state.brushColor,
    }
    set({
      elements: [...state.elements, el],
      selectedId: el.id,
    })
  },

  continueBrushStroke: (x, y) => {
    const state = get()
    const elements = [...state.elements]
    const last = elements[elements.length - 1]
    if (last && last.type === 'brush' && last.id === state.selectedId) {
      const newLast: BrushElement = {
        ...last,
        points: [...last.points, { x, y }],
      }
      elements[elements.length - 1] = newLast
      set({ elements })
    }
  },

  finishBrushStroke: () => {
    set({})
  },

  updateElement: (id, updates) => {
    const state = get()
    const elements = state.elements.map((el) =>
      el.id === id ? ({ ...el, ...updates } as PostcardElement) : el
    )
    set({ elements })
  },

  deleteElement: (id) => {
    const state = get()
    state.pushHistory()
    set({
      elements: state.elements.filter((el) => el.id !== id),
      selectedId: null,
    })
  },

  pushHistory: () => {
    const state = get()
    const newHistory = state.history.slice(0, state.historyIndex + 1)
    newHistory.push(state.elements.map((el) => ({ ...el })) as PostcardElement[])
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    })
  },

  undo: () => {
    const state = get()
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1
      set({
        historyIndex: newIndex,
        elements: state.history[newIndex].map((el) => ({ ...el })) as PostcardElement[],
        selectedId: null,
      })
    }
  },

  redo: () => {
    const state = get()
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1
      set({
        historyIndex: newIndex,
        elements: state.history[newIndex].map((el) => ({ ...el })) as PostcardElement[],
        selectedId: null,
      })
    }
  },
}))
