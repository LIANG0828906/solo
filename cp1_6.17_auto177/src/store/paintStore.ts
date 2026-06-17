import { create } from 'zustand'
import type { BrushParams, PaperType, RGB } from '../types'
import { BASE_COLORS } from '../types'

interface PaintState extends BrushParams {
  isPipette: boolean
  setSize: (n: number) => void
  setWaterContent: (n: number) => void
  setTextureStrength: (n: number) => void
  setPaperType: (p: PaperType) => void
  setColor: (c: RGB) => void
  setBaseColorIndex: (i: number) => void
  baseColorIndex: number
  togglePipette: () => void
  setPipette: (v: boolean) => void
}

export const usePaintStore = create<PaintState>((set) => ({
  size: 24,
  waterContent: 50,
  textureStrength: 50,
  paperType: 'medium',
  currentColor: BASE_COLORS[0],
  baseColorIndex: 0,
  isPipette: false,
  setSize: (n) => set({ size: Math.max(8, Math.min(80, n)) }),
  setWaterContent: (n) => set({ waterContent: Math.max(0, Math.min(100, n)) }),
  setTextureStrength: (n) => set({ textureStrength: Math.max(0, Math.min(100, n)) }),
  setPaperType: (p) => set({ paperType: p }),
  setColor: (c) => set({ currentColor: c, baseColorIndex: -1 }),
  setBaseColorIndex: (i) => set({ baseColorIndex: i, currentColor: BASE_COLORS[i] }),
  togglePipette: () => set((s) => ({ isPipette: !s.isPipette })),
  setPipette: (v) => set({ isPipette: v }),
}))
