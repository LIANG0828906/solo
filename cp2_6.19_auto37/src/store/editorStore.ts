import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type ToolType = 'select' | 'text' | 'brush' | 'sticker'

export interface BaseLayer {
  id: string
  type: 'background' | 'text' | 'brush' | 'sticker'
  name: string
  x: number
  y: number
  rotation: number
  scale: number
  visible: boolean
}

export interface BackgroundLayer extends BaseLayer {
  type: 'background'
  imageUrl: string
  width: number
  height: number
}

export interface TextLayer extends BaseLayer {
  type: 'text'
  text: string
  fontSize: number
  fontFamily: string
  color: string
  strokeColor: string
  strokeWidth: number
}

export interface BrushLayer extends BaseLayer {
  type: 'brush'
  paths: { x: number; y: number }[][]
  strokeWidth: number
  color: string
}

export interface StickerLayer extends BaseLayer {
  type: 'sticker'
  emoji: string
  size: number
}

export type Layer = BackgroundLayer | TextLayer | BrushLayer | StickerLayer

export interface StickerItem {
  emoji: string
  name: string
}

export const STICKERS: StickerItem[] = [
  { emoji: '😀', name: '笑脸' },
  { emoji: '😂', name: '笑哭' },
  { emoji: '🤣', name: '笑翻' },
  { emoji: '😍', name: '爱心眼' },
  { emoji: '🤔', name: '思考' },
  { emoji: '😎', name: '酷' },
  { emoji: '🥺', name: '可怜' },
  { emoji: '🔥', name: '火焰' },
  { emoji: '💯', name: '满分' },
  { emoji: '✨', name: '闪亮' },
  { emoji: '💪', name: '加油' },
  { emoji: '🎉', name: '庆祝' },
]

export const BRUSH_SIZES = [2, 3, 4, 5]

export const FONT_FAMILIES = [
  { name: '默认', value: 'Arial, sans-serif' },
  { name: '黑体', value: '"Microsoft YaHei", sans-serif' },
  { name: '宋体', value: '"SimSun", serif' },
  { name: '楷体', value: '"KaiTi", serif' },
  { name: 'Impact', value: 'Impact, sans-serif' },
]

interface EditorState {
  currentTool: ToolType
  layers: Layer[]
  selectedLayerId: string | null
  canvasScale: number
  canvasOffset: { x: number; y: number }
  canvasSize: { width: number; height: number }
  brushSize: number
  brushColor: string
  textColor: string
  textFontSize: number
  textFontFamily: string
  isDrawing: boolean
  currentPath: { x: number; y: number }[]
  highlightLayerId: string | null

  setCurrentTool: (tool: ToolType) => void
  addBackgroundImage: (imageUrl: string, width: number, height: number) => void
  addTextLayer: (x: number, y: number) => void
  addStickerLayer: (emoji: string, x: number, y: number) => void
  addBrushLayer: (paths: { x: number; y: number }[][]) => void
  updateLayer: (id: string, updates: Partial<Layer>) => void
  deleteLayer: (id: string) => void
  selectLayer: (id: string | null) => void
  reorderLayers: (fromIndex: number, toIndex: number) => void
  setCanvasScale: (scale: number) => void
  setCanvasOffset: (offset: { x: number; y: number }) => void
  setCanvasSize: (size: { width: number; height: number }) => void
  setBrushSize: (size: number) => void
  setBrushColor: (color: string) => void
  setTextColor: (color: string) => void
  setTextFontSize: (size: number) => void
  setTextFontFamily: (font: string) => void
  setIsDrawing: (drawing: boolean) => void
  setCurrentPath: (path: { x: number; y: number }[]) => void
  setHighlightLayerId: (id: string | null) => void
  resetCanvas: () => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  currentTool: 'select',
  layers: [],
  selectedLayerId: null,
  canvasScale: 1,
  canvasOffset: { x: 0, y: 0 },
  canvasSize: { width: 300, height: 300 },
  brushSize: 3,
  brushColor: '#ffffff',
  textColor: '#ffffff',
  textFontSize: 24,
  textFontFamily: 'Arial, sans-serif',
  isDrawing: false,
  currentPath: [],
  highlightLayerId: null,

  setCurrentTool: (tool) => set({ currentTool: tool, selectedLayerId: null }),

  addBackgroundImage: (imageUrl, width, height) => {
    const bgLayer: BackgroundLayer = {
      id: uuidv4(),
      type: 'background',
      name: '底图',
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      visible: true,
      imageUrl,
      width,
      height,
    }
    const existingBg = get().layers.find(l => l.type === 'background')
    if (existingBg) {
      set(state => ({
        layers: state.layers.map(l =>
          l.type === 'background' ? { ...bgLayer, id: l.id } : l
        ),
      }))
    } else {
      set(state => ({ layers: [bgLayer, ...state.layers] }))
    }
  },

  addTextLayer: (x, y) => {
    const textLayer: TextLayer = {
      id: uuidv4(),
      type: 'text',
      name: '文字',
      x,
      y,
      rotation: 0,
      scale: 1,
      visible: true,
      text: '点击编辑',
      fontSize: get().textFontSize,
      fontFamily: get().textFontFamily,
      color: get().textColor,
      strokeColor: '#000000',
      strokeWidth: 2,
    }
    set(state => ({
      layers: [...state.layers, textLayer],
      selectedLayerId: textLayer.id,
      currentTool: 'select',
    }))
  },

  addStickerLayer: (emoji, x, y) => {
    const stickerLayer: StickerLayer = {
      id: uuidv4(),
      type: 'sticker',
      name: emoji,
      x,
      y,
      rotation: 0,
      scale: 1,
      visible: true,
      emoji,
      size: 48,
    }
    set(state => ({
      layers: [...state.layers, stickerLayer],
      selectedLayerId: stickerLayer.id,
    }))
  },

  addBrushLayer: (paths) => {
    const brushLayer: BrushLayer = {
      id: uuidv4(),
      type: 'brush',
      name: '涂鸦',
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      visible: true,
      paths,
      strokeWidth: get().brushSize,
      color: get().brushColor,
    }
    set(state => ({
      layers: [...state.layers, brushLayer],
      selectedLayerId: brushLayer.id,
      currentPath: [],
      isDrawing: false,
    }))
  },

  updateLayer: (id, updates) => {
    set(state => ({
      layers: state.layers.map(l =>
        l.id === id ? { ...l, ...updates } as Layer : l
      ),
    }))
  },

  deleteLayer: (id) => {
    set(state => ({
      layers: state.layers.filter(l => l.id !== id),
      selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId,
    }))
  },

  selectLayer: (id) => set({ selectedLayerId: id }),

  reorderLayers: (fromIndex, toIndex) => {
    set(state => {
      const newLayers = [...state.layers]
      const [removed] = newLayers.splice(fromIndex, 1)
      newLayers.splice(toIndex, 0, removed)
      return { layers: newLayers }
    })
  },

  setCanvasScale: (scale) => set({ canvasScale: Math.max(0.1, Math.min(5, scale)) }),
  setCanvasOffset: (offset) => set({ canvasOffset: offset }),
  setCanvasSize: (size) => set({ canvasSize: size }),
  setBrushSize: (size) => set({ brushSize: size }),
  setBrushColor: (color) => set({ brushColor: color }),
  setTextColor: (color) => set({ textColor: color }),
  setTextFontSize: (size) => set({ textFontSize: size }),
  setTextFontFamily: (font) => set({ textFontFamily: font }),
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  setCurrentPath: (path) => set({ currentPath: path }),
  setHighlightLayerId: (id) => set({ highlightLayerId: id }),

  resetCanvas: () => set({
    layers: [],
    selectedLayerId: null,
    canvasScale: 1,
    canvasOffset: { x: 0, y: 0 },
  }),
}))
