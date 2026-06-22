import { create } from 'zustand'

export type MetalType = 'gold' | 'silver' | 'rosegold' | 'platinum'
export type GemType = 'diamond' | 'ruby' | 'sapphire' | 'emerald'
export type LightEnvType = 'store' | 'outdoor' | 'stage'
export type ViewType = 'front' | 'side45' | 'top'

export interface Marker {
  id: string
  position: [number, number, number]
  note: string
}

export interface Snapshot {
  id: string
  thumbnail: string
  cameraPosition: [number, number, number]
  cameraTarget: [number, number, number]
  metal: MetalType
  gem: GemType
  size: number
  lightEnv: LightEnvType
  markers: Marker[]
  timestamp: number
}

interface JewelryState {
  metal: MetalType
  gem: GemType
  size: number
  lightEnv: LightEnvType
  currentView: ViewType
  markers: Marker[]
  snapshots: Snapshot[]
  toast: { type: 'success' | 'error'; message: string } | null
  setMetal: (metal: MetalType) => void
  setGem: (gem: GemType) => void
  setSize: (size: number) => void
  setLightEnv: (env: LightEnvType) => void
  setCurrentView: (view: ViewType) => void
  addMarker: (position: [number, number, number], note: string) => void
  removeMarker: (id: string) => void
  updateMarkerNote: (id: string, note: string) => void
  addSnapshot: (snapshot: Snapshot) => void
  removeSnapshot: (id: string) => void
  showToast: (type: 'success' | 'error', message: string) => void
  hideToast: () => void
}

export const useJewelryStore = create<JewelryState>((set) => ({
  metal: 'gold',
  gem: 'diamond',
  size: 2.0,
  lightEnv: 'store',
  currentView: 'side45',
  markers: [],
  snapshots: [],
  toast: null,

  setMetal: (metal) => set({ metal }),
  setGem: (gem) => set({ gem }),
  setSize: (size) => set({ size }),
  setLightEnv: (lightEnv) => set({ lightEnv }),
  setCurrentView: (currentView) => set({ currentView }),

  addMarker: (position, note) =>
    set((state) => ({
      markers: [
        ...state.markers,
        {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          position,
          note,
        },
      ],
    })),

  removeMarker: (id) =>
    set((state) => ({
      markers: state.markers.filter((m) => m.id !== id),
    })),

  updateMarkerNote: (id, note) =>
    set((state) => ({
      markers: state.markers.map((m) =>
        m.id === id ? { ...m, note } : m
      ),
    })),

  addSnapshot: (snapshot) =>
    set((state) => {
      const newSnapshots = [snapshot, ...state.snapshots].slice(0, 12)
      return { snapshots: newSnapshots }
    }),

  removeSnapshot: (id) =>
    set((state) => ({
      snapshots: state.snapshots.filter((s) => s.id !== id),
    })),

  showToast: (type, message) => {
    set({ toast: { type, message } })
    setTimeout(() => set({ toast: null }), 3000)
  },

  hideToast: () => set({ toast: null }),
}))

export const METAL_COLORS: Record<MetalType, string> = {
  gold: '#FFD700',
  silver: '#C0C0C0',
  rosegold: '#E8A87C',
  platinum: '#E5E4E2',
}

export const METAL_NAMES: Record<MetalType, string> = {
  gold: '黄金',
  silver: '白银',
  rosegold: '玫瑰金',
  platinum: '铂金',
}

export const GEM_NAMES: Record<GemType, string> = {
  diamond: '钻石',
  ruby: '红宝石',
  sapphire: '蓝宝石',
  emerald: '祖母绿',
}

export const GEM_COLORS: Record<GemType, string> = {
  diamond: '#FFFFFF',
  ruby: '#E0115F',
  sapphire: '#0F52BA',
  emerald: '#50C878',
}

export const LIGHT_NAMES: Record<LightEnvType, string> = {
  store: '珠宝店',
  outdoor: '自然光',
  stage: '舞台光',
}

export const VIEW_NAMES: Record<ViewType, string> = {
  front: '正面',
  side45: '侧面45°',
  top: '俯视',
}

export const getRingSizeCode = (diameter: number): string => {
  const mapping: Record<number, number> = {
    1.5: 8, 1.6: 10, 1.7: 12, 1.8: 14, 1.9: 16,
    2.0: 18, 2.1: 20, 2.2: 22, 2.3: 24, 2.4: 26, 2.5: 28,
  }
  const key = Math.round(diameter * 10) / 10
  const code = mapping[key]
  return code ? `${code}号` : '—'
}
