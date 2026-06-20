import { create } from 'zustand'

export interface BuildingBlockData {
  id: string
  name: string
  position: { x: number; y: number; z: number }
  dimensions: { width: number; length: number; height: number }
  color: string
  opacity: number
}

export interface CameraView {
  position: [number, number, number]
  target: [number, number, number]
}

export const PRESET_VIEWS: Record<string, CameraView> = {
  top: { position: [0, 15, 0.01], target: [0, 0, 0] },
  side: { position: [15, 5, 0], target: [0, 0, 0] },
  front: { position: [0, 5, 15], target: [0, 0, 0] },
}

export const PRESET_COLORS = [
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
  '#3498db', '#9b59b6', '#e91e63', '#00bcd4', '#8bc34a',
  '#ff5722', '#795548', '#607d8b', '#ff9800', '#cddc39',
  '#4caf50', '#03a9f4', '#673ab7', '#f44336', '#808080',
]

let blockCounter = 0

function generateId(): string {
  return `block_${Date.now()}_${++blockCounter}`
}

function createDefaultBlock(partial?: Partial<BuildingBlockData>): BuildingBlockData {
  const id = generateId()
  return {
    id,
    name: `体块 ${blockCounter}`,
    position: { x: 0, y: 0, z: 0 },
    dimensions: { width: 2, length: 2, height: 3 },
    color: '#808080',
    opacity: 0.85,
    ...partial,
  }
}

interface SceneState {
  blocks: BuildingBlockData[]
  selectedBlockId: string | null
  isPanelCollapsed: boolean
  pendingCameraView: CameraView | null
  deleteConfirmId: string | null

  addBlock: (partial?: Partial<BuildingBlockData>) => string
  updateBlock: (id: string, updates: Partial<BuildingBlockData>) => void
  deleteBlock: (id: string) => void
  duplicateBlock: (id: string) => void
  selectBlock: (id: string | null) => void
  togglePanel: () => void
  setPanelCollapsed: (collapsed: boolean) => void
  requestCameraView: (view: CameraView) => void
  clearCameraView: () => void
  setDeleteConfirm: (id: string | null) => void
  applyHeightColorMapping: () => void
  importBlocks: (data: BuildingBlockData[]) => void
}

export const useSceneStore = create<SceneState>((set, get) => ({
  blocks: [],
  selectedBlockId: null,
  isPanelCollapsed: false,
  pendingCameraView: null,
  deleteConfirmId: null,

  addBlock: (partial?: Partial<BuildingBlockData>) => {
    const state = get()
    if (state.blocks.length >= 50) return ''
    const block = createDefaultBlock(partial)
    set({ blocks: [...state.blocks, block], selectedBlockId: block.id })
    return block.id
  },

  updateBlock: (id: string, updates: Partial<BuildingBlockData>) => {
    set((state) => ({
      blocks: state.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }))
  },

  deleteBlock: (id: string) => {
    set((state) => ({
      blocks: state.blocks.filter((b) => b.id !== id),
      selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
      deleteConfirmId: null,
    }))
  },

  duplicateBlock: (id: string) => {
    const state = get()
    if (state.blocks.length >= 50) return
    const source = state.blocks.find((b) => b.id === id)
    if (!source) return
    const newBlock = createDefaultBlock({
      name: `${source.name} 副本`,
      position: {
        x: source.position.x,
        y: source.position.y + 0.5,
        z: source.position.z,
      },
      dimensions: { ...source.dimensions },
      color: source.color,
      opacity: source.opacity,
    })
    set({
      blocks: [...state.blocks, newBlock],
      selectedBlockId: newBlock.id,
    })
  },

  selectBlock: (id: string | null) => {
    set({ selectedBlockId: id })
  },

  togglePanel: () => {
    set((state) => ({ isPanelCollapsed: !state.isPanelCollapsed }))
  },

  setPanelCollapsed: (collapsed: boolean) => {
    set({ isPanelCollapsed: collapsed })
  },

  requestCameraView: (view: CameraView) => {
    set({ pendingCameraView: view })
  },

  clearCameraView: () => {
    set({ pendingCameraView: null })
  },

  setDeleteConfirm: (id: string | null) => {
    set({ deleteConfirmId: id })
  },

  applyHeightColorMapping: () => {
    const state = get()
    if (state.blocks.length === 0) return

    const heights = state.blocks.map((b) => b.dimensions.height)
    const minH = Math.min(...heights)
    const maxH = Math.max(...heights)

    const colorStops = [
      { t: 0, r: 0x34, g: 0x98, b: 0xdb },
      { t: 0.5, r: 0x2e, g: 0xcc, b: 0x71 },
      { t: 1, r: 0xe7, g: 0x4c, b: 0x3c },
    ]

    const lerpColor = (t: number): string => {
      const clamped = Math.max(0, Math.min(1, t))
      let lower = colorStops[0]
      let upper = colorStops[colorStops.length - 1]
      for (let i = 0; i < colorStops.length - 1; i++) {
        if (clamped >= colorStops[i].t && clamped <= colorStops[i + 1].t) {
          lower = colorStops[i]
          upper = colorStops[i + 1]
          break
        }
      }
      const range = upper.t - lower.t
      const localT = range === 0 ? 0 : (clamped - lower.t) / range
      const r = Math.round(lower.r + (upper.r - lower.r) * localT)
      const g = Math.round(lower.g + (upper.g - lower.g) * localT)
      const b = Math.round(lower.b + (upper.b - lower.b) * localT)
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    }

    const range = maxH - minH
    const updatedBlocks = state.blocks.map((b) => {
      const t = range === 0 ? 0.5 : (b.dimensions.height - minH) / range
      return { ...b, color: lerpColor(t) }
    })

    set({ blocks: updatedBlocks })
  },

  importBlocks: (data: BuildingBlockData[]) => {
    const state = get()
    const newBlocks = data.slice(0, 50 - state.blocks.length).map((d, i) => ({
      ...createDefaultBlock(d),
      id: d.id || generateId(),
      name: d.name || `导入体块 ${i + 1}`,
    }))
    set({ blocks: [...state.blocks, ...newBlocks] })
  },
}))
