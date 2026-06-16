import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type VoxelMode = 'place' | 'remove' | 'pick'
export type BrushSize = 1 | 2 | 3
export type AnimationType = 'rotate' | 'bounce' | 'wave'

export interface Voxel {
  id: string
  x: number
  y: number
  z: number
  color: string
  animOffset?: number
}

export interface AnimationConfig {
  type: AnimationType
  speed: number
  isPlaying: boolean
}

interface VoxelState {
  voxels: Voxel[]
  currentColor: string
  brushSize: BrushSize
  mode: VoxelMode
  undoStack: Voxel[][]
  redoStack: Voxel[][]
  animation: AnimationConfig
  selectedVoxel: string | null
  pulseTrigger: number

  addVoxel: (x: number, y: number, z: number, color?: string) => void
  removeVoxel: (id: string) => void
  removeVoxelAt: (x: number, y: number, z: number) => void
  pickColor: (color: string) => void
  setColor: (color: string) => void
  setBrushSize: (size: BrushSize) => void
  setMode: (mode: VoxelMode) => void
  setSelectedVoxel: (id: string | null) => void

  undo: () => void
  redo: () => void

  setAnimation: (config: Partial<AnimationConfig>) => void
  startAnimation: () => void
  pauseAnimation: () => void
  resetAnimation: () => void
  setAnimationType: (type: AnimationType) => void

  importSnapshot: (data: { voxels: Voxel[]; animation?: AnimationConfig }) => void
  clearVoxels: () => void
  triggerPulse: () => void
}

export const PRESET_COLORS = [
  { name: '白色', color: '#FFFFFF' },
  { name: '浅灰', color: '#C0C0C0' },
  { name: '深灰', color: '#606060' },
  { name: '黑色', color: '#202020' },
  { name: '红色', color: '#FF4040' },
  { name: '橙色', color: '#FF8030' },
  { name: '黄色', color: '#FFD040' },
  { name: '金色', color: '#FFB020' },
  { name: '浅绿', color: '#80FF60' },
  { name: '绿色', color: '#40C040' },
  { name: '深绿', color: '#208030' },
  { name: '青绿', color: '#40FFC0' },
  { name: '浅蓝', color: '#60C0FF' },
  { name: '蓝色', color: '#4060FF' },
  { name: '深蓝', color: '#2030A0' },
  { name: '靛蓝', color: '#5040D0' },
  { name: '紫色', color: '#A040FF' },
  { name: '洋红', color: '#FF40C0' },
  { name: '粉色', color: '#FFA0C0' },
  { name: '棕色', color: '#805030' },
  { name: '米色', color: '#D0B080' },
  { name: '橄榄', color: '#809030' },
  { name: '青色', color: '#00E0FF' },
  { name: '品红', color: '#FF00FF' },
]

const pushHistory = (state: VoxelState): Partial<VoxelState> => ({
  undoStack: [...state.undoStack, [...state.voxels]],
  redoStack: [],
})

export const useVoxelStore = create<VoxelState>((set, get) => ({
  voxels: [],
  currentColor: PRESET_COLORS[12].color,
  brushSize: 1,
  mode: 'place',
  undoStack: [],
  redoStack: [],
  animation: {
    type: 'rotate',
    speed: 1,
    isPlaying: false,
  },
  selectedVoxel: null,
  pulseTrigger: 0,

  addVoxel: (x, y, z, color) => {
    const state = get()
    const c = color || state.currentColor
    const exists = state.voxels.find(v => v.x === x && v.y === y && v.z === z)
    if (exists) return

    const newVoxel: Voxel = {
      id: uuidv4(),
      x, y, z,
      color: c,
      animOffset: Math.random() * Math.PI * 2,
    }

    set({
      ...pushHistory(state),
      voxels: [...state.voxels, newVoxel],
    })
  },

  removeVoxel: (id) => {
    const state = get()
    const voxel = state.voxels.find(v => v.id === id)
    if (!voxel) return
    set({
      ...pushHistory(state),
      voxels: state.voxels.filter(v => v.id !== id),
      selectedVoxel: state.selectedVoxel === id ? null : state.selectedVoxel,
    })
  },

  removeVoxelAt: (x, y, z) => {
    const state = get()
    const voxel = state.voxels.find(v => v.x === x && v.y === y && v.z === z)
    if (!voxel) return
    get().removeVoxel(voxel.id)
  },

  pickColor: (color) => {
    set({ currentColor: color, mode: 'place' })
  },

  setColor: (color) => set({ currentColor: color }),
  setBrushSize: (size) => set({ brushSize: size }),
  setMode: (mode) => set({ mode }),
  setSelectedVoxel: (id) => set({ selectedVoxel: id }),

  undo: () => {
    const state = get()
    if (state.undoStack.length === 0) return
    const prev = state.undoStack[state.undoStack.length - 1]
    set({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, state.voxels],
      voxels: prev,
      pulseTrigger: state.pulseTrigger + 1,
    })
  },

  redo: () => {
    const state = get()
    if (state.redoStack.length === 0) return
    const next = state.redoStack[state.redoStack.length - 1]
    set({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, state.voxels],
      voxels: next,
      pulseTrigger: state.pulseTrigger + 1,
    })
  },

  setAnimation: (config) => set(s => ({
    animation: { ...s.animation, ...config },
  })),

  startAnimation: () => set(s => ({
    animation: { ...s.animation, isPlaying: true },
  })),

  pauseAnimation: () => set(s => ({
    animation: { ...s.animation, isPlaying: false },
  })),

  resetAnimation: () => set(s => ({
    animation: { ...s.animation, isPlaying: false },
  })),

  setAnimationType: (type) => set(s => ({
    animation: { ...s.animation, type },
  })),

  importSnapshot: (data) => {
    const state = get()
    set({
      ...pushHistory(state),
      voxels: data.voxels.map(v => ({
        ...v,
        id: v.id || uuidv4(),
        animOffset: v.animOffset ?? Math.random() * Math.PI * 2,
      })),
      animation: data.animation || { type: 'rotate', speed: 1, isPlaying: false },
    })
  },

  clearVoxels: () => {
    const state = get()
    set({
      ...pushHistory(state),
      voxels: [],
    })
  },

  triggerPulse: () => set(s => ({ pulseTrigger: s.pulseTrigger + 1 })),
}))
