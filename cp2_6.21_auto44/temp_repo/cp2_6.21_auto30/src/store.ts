import { create } from 'zustand'

export type ShapeType = 'circle' | 'roundedRect' | 'hexagon'

export interface BadgeState {
  shape: ShapeType
  icon: string
  backgroundColor: string
  foregroundColor: string
  borderColor: string
  borderWidth: number
  borderRadius: number
  scale: number
  setShape: (shape: ShapeType) => void
  setIcon: (icon: string) => void
  setColor: (key: 'backgroundColor' | 'foregroundColor' | 'borderColor', value: string) => void
  setBorder: (width: number) => void
  setRadius: (radius: number) => void
  setScale: (scale: number) => void
  reset: () => void
}

const initialState = {
  shape: 'circle' as ShapeType,
  icon: 'star',
  backgroundColor: '#6366f1',
  foregroundColor: '#ffffff',
  borderColor: '#4f46e5',
  borderWidth: 2,
  borderRadius: 12,
  scale: 100,
}

export const useBadgeStore = create<BadgeState>((set) => ({
  ...initialState,
  setShape: (shape) => set({ shape }),
  setIcon: (icon) => set({ icon }),
  setColor: (key, value) => set({ [key]: value }),
  setBorder: (borderWidth) => set({ borderWidth }),
  setRadius: (borderRadius) => set({ borderRadius }),
  setScale: (scale) => set({ scale }),
  reset: () => set(initialState),
}))
