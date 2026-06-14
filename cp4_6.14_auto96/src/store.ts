import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type ToolType = 'pencil' | 'marker' | 'airbrush' | 'select'

export interface Point {
  x: number
  y: number
  pressure?: number
  timestamp: number
}

export interface Stroke {
  id: string
  tool: ToolType
  color: string
  baseSize: number
  points: Point[]
  layerId: string
  opacity: number
  createdAt: number
  particles?: { x: number; y: number; size: number; opacity: number; createdAt: number }[]
}

export interface Layer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  strokeIds: string[]
}

export interface Selection {
  active: boolean
  startX: number
  startY: number
  endX: number
  endY: number
}

export interface AICompletingState {
  active: boolean
  strokes: Stroke[]
  currentIndex: number
  startTime: number
}

interface CanvasState {
  tool: ToolType
  color: string
  brushSize: number
  layers: Layer[]
  activeLayerId: string
  strokes: Record<string, Stroke>
  selection: Selection
  viewOffset: { x: number; y: number }
  zoom: number
  aiCompleting: AICompletingState
  mousePos: { x: number; y: number }
  isDrawing: boolean
  currentStroke: Stroke | null

  setTool: (tool: ToolType) => void
  setColor: (color: string) => void
  setBrushSize: (size: number) => void
  setMousePos: (x: number, y: number) => void

  startDrawing: (x: number, y: number) => void
  continueDrawing: (x: number, y: number) => void
  endDrawing: () => void

  startSelection: (x: number, y: number) => void
  updateSelection: (x: number, y: number) => void
  clearSelection: () => void

  addLayer: () => void
  setActiveLayer: (id: string) => void
  toggleLayerVisibility: (id: string) => void
  deleteStroke: (id: string) => void

  setViewOffset: (x: number, y: number) => void
  setZoom: (zoom: number) => void

  startAICompletion: (strokes: Stroke[]) => void
  updateAICompletion: (currentIndex: number) => void
  finishAICompletion: () => void
}

export const COLOR_PALETTE = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff',
  '#4a86e8', '#0000ff', '#9900ff', '#ff00ff', '#e6b8af', '#f4cccc',
  '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3',
  '#d9d2e9', '#ead1dc', '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599',
  '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd'
]

export const useCanvasStore = create<CanvasState>((set, get) => {
  const initialLayerId = uuidv4()

  return {
    tool: 'pencil',
    color: '#000000',
    brushSize: 20,
    layers: [
      {
        id: initialLayerId,
        name: '图层 1',
        visible: true,
        locked: false,
        strokeIds: []
      }
    ],
    activeLayerId: initialLayerId,
    strokes: {},
    selection: { active: false, startX: 0, startY: 0, endX: 0, endY: 0 },
    viewOffset: { x: 0, y: 0 },
    zoom: 1,
    aiCompleting: { active: false, strokes: [], currentIndex: 0, startTime: 0 },
    mousePos: { x: 0, y: 0 },
    isDrawing: false,
    currentStroke: null,

    setTool: (tool) => set({ tool }),
    setColor: (color) => set({ color }),
    setBrushSize: (size) => set({ brushSize: size }),
    setMousePos: (x, y) => set({ mousePos: { x, y } }),

    startDrawing: (x, y) => {
      const { tool, color, brushSize, activeLayerId } = get()
      if (tool === 'select') return

      const stroke: Stroke = {
        id: uuidv4(),
        tool,
        color,
        baseSize: brushSize,
        points: [{ x, y, timestamp: Date.now() }],
        layerId: activeLayerId,
        opacity: 1,
        createdAt: Date.now(),
        particles: tool === 'airbrush' ? [] : undefined
      }

      if (tool === 'airbrush') {
        const particles = []
        for (let i = 0; i < 15; i++) {
          const angle = Math.random() * Math.PI * 2
          const dist = Math.random() * brushSize * 1.5
          particles.push({
            x: x + Math.cos(angle) * dist,
            y: y + Math.sin(angle) * dist,
            size: 2 + Math.random() * 4,
            opacity: 0.3 + Math.random() * 0.3,
            createdAt: Date.now()
          })
        }
        stroke.particles = particles
      }

      set({ isDrawing: true, currentStroke: stroke })
    },

    continueDrawing: (x, y) => {
      const { isDrawing, currentStroke } = get()
      if (!isDrawing || !currentStroke) return

      const newPoints = [...currentStroke.points, { x, y, timestamp: Date.now() }]
      let newParticles = currentStroke.particles

      if (currentStroke.tool === 'airbrush') {
        const particles = [...(currentStroke.particles || [])]
        for (let i = 0; i < 8; i++) {
          const angle = Math.random() * Math.PI * 2
          const dist = Math.random() * currentStroke.baseSize * 1.5
          particles.push({
            x: x + Math.cos(angle) * dist,
            y: y + Math.sin(angle) * dist,
            size: 2 + Math.random() * 4,
            opacity: 0.3 + Math.random() * 0.3,
            createdAt: Date.now()
          })
        }
        newParticles = particles
      }

      set({
        currentStroke: {
          ...currentStroke,
          points: newPoints,
          particles: newParticles
        }
      })
    },

    endDrawing: () => {
      const { currentStroke, activeLayerId, strokes, layers } = get()
      if (!currentStroke) {
        set({ isDrawing: false })
        return
      }

      const newStrokes = { ...strokes, [currentStroke.id]: currentStroke }
      const newLayers = layers.map(layer => {
        if (layer.id === activeLayerId) {
          return { ...layer, strokeIds: [...layer.strokeIds, currentStroke.id] }
        }
        return layer
      })

      set({
        strokes: newStrokes,
        layers: newLayers,
        isDrawing: false,
        currentStroke: null
      })
    },

    startSelection: (x, y) => {
      set({
        selection: { active: true, startX: x, startY: y, endX: x, endY: y }
      })
    },

    updateSelection: (x, y) => {
      const { selection } = get()
      if (!selection.active) return
      set({
        selection: { ...selection, endX: x, endY: y }
      })
    },

    clearSelection: () => {
      set({
        selection: { active: false, startX: 0, startY: 0, endX: 0, endY: 0 }
      })
    },

    addLayer: () => {
      const { layers } = get()
      const newLayer: Layer = {
        id: uuidv4(),
        name: `图层 ${layers.length + 1}`,
        visible: true,
        locked: false,
        strokeIds: []
      }
      set({
        layers: [...layers, newLayer],
        activeLayerId: newLayer.id
      })
    },

    setActiveLayer: (id) => set({ activeLayerId: id }),

    toggleLayerVisibility: (id) => {
      const { layers } = get()
      set({
        layers: layers.map(layer =>
          layer.id === id ? { ...layer, visible: !layer.visible } : layer
        )
      })
    },

    deleteStroke: (id) => {
      const { strokes, layers } = get()
      const stroke = strokes[id]
      if (!stroke) return

      const newStrokes = { ...strokes }
      delete newStrokes[id]

      const newLayers = layers.map(layer => ({
        ...layer,
        strokeIds: layer.strokeIds.filter(sid => sid !== id)
      }))

      set({ strokes: newStrokes, layers: newLayers })
    },

    setViewOffset: (x, y) => set({ viewOffset: { x, y } }),
    setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),

    startAICompletion: (strokes) => {
      set({
        aiCompleting: {
          active: true,
          strokes,
          currentIndex: 0,
          startTime: Date.now()
        }
      })
    },

    updateAICompletion: (currentIndex) => {
      const { aiCompleting } = get()
      set({
        aiCompleting: { ...aiCompleting, currentIndex }
      })
    },

    finishAICompletion: () => {
      const { aiCompleting, layers, activeLayerId, strokes } = get()
      const newStrokes = { ...strokes }
      const newStrokeIds: string[] = []

      aiCompleting.strokes.forEach(stroke => {
        newStrokes[stroke.id] = stroke
        newStrokeIds.push(stroke.id)
      })

      const newLayers = layers.map(layer => {
        if (layer.id === activeLayerId) {
          return { ...layer, strokeIds: [...layer.strokeIds, ...newStrokeIds] }
        }
        return layer
      })

      set({
        strokes: newStrokes,
        layers: newLayers,
        aiCompleting: { active: false, strokes: [], currentIndex: 0, startTime: 0 }
      })
    }
  }
})
