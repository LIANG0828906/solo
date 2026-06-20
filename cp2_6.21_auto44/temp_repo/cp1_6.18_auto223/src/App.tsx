import { create } from 'zustand'
import { PatternEditor } from './PatternEditor'

export type ShapeType = 'circle' | 'spiral' | 'ripple'
export type ColorTheme = 'warmSun' | 'aurora' | 'darkNight'
export type DynamicType = 'breathe' | 'flow' | 'blink'

export interface PatternParams {
  shape: ShapeType
  colorTheme: ColorTheme
  dynamicType: DynamicType
  speed: number
}

export interface SavedPattern {
  id: string
  params: PatternParams
  thumbnail: string
  createdAt: number
}

interface PatternStore {
  params: PatternParams
  savedPatterns: SavedPattern[]
  isGalleryOpen: boolean
  setParams: (p: Partial<PatternParams>) => void
  savePattern: (thumbnail: string) => void
  loadPattern: (id: string) => void
  deletePattern: (id: string) => void
  setGalleryOpen: (open: boolean) => void
}

const STORAGE_KEY = 'lightweaver_saved_patterns'
const MAX_SAVES = 20

function loadFromStorage(): SavedPattern[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(patterns: SavedPattern[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns))
}

export const PRESETS: { name: string; params: PatternParams }[] = [
  { name: '星轨', params: { shape: 'spiral', colorTheme: 'darkNight', dynamicType: 'flow', speed: 0.8 } },
  { name: '水波', params: { shape: 'ripple', colorTheme: 'aurora', dynamicType: 'breathe', speed: 0.4 } },
  { name: '极光', params: { shape: 'spiral', colorTheme: 'aurora', dynamicType: 'flow', speed: 0.6 } },
  { name: '万花筒', params: { shape: 'circle', colorTheme: 'warmSun', dynamicType: 'blink', speed: 1.0 } },
  { name: '脉冲', params: { shape: 'ripple', colorTheme: 'darkNight', dynamicType: 'blink', speed: 1.2 } },
]

export const THEME_ACCENT: Record<ColorTheme, string> = {
  warmSun: '#FF6B35',
  aurora: '#00C853',
  darkNight: '#2962FF',
}

export const useStore = create<PatternStore>((set, get) => ({
  params: {
    shape: 'circle',
    colorTheme: 'warmSun',
    dynamicType: 'flow',
    speed: 0.5,
  },
  savedPatterns: loadFromStorage(),
  isGalleryOpen: false,
  setParams: (p) => set((s) => ({ params: { ...s.params, ...p } })),
  savePattern: (thumbnail) => {
    const { params, savedPatterns } = get()
    const entry: SavedPattern = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      params: { ...params },
      thumbnail,
      createdAt: Date.now(),
    }
    const updated = [entry, ...savedPatterns].slice(0, MAX_SAVES)
    saveToStorage(updated)
    set({ savedPatterns: updated })
  },
  loadPattern: (id) => {
    const p = get().savedPatterns.find((s) => s.id === id)
    if (p) set({ params: { ...p.params } })
  },
  deletePattern: (id) => {
    const updated = get().savedPatterns.filter((s) => s.id !== id)
    saveToStorage(updated)
    set({ savedPatterns: updated })
  },
  setGalleryOpen: (open) => set({ isGalleryOpen: open }),
}))

export default function App() {
  return <PatternEditor />
}
