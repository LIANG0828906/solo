import { create } from 'zustand'
import type { CanvasState, Point } from '@/types'
import { clamp, screenToCanvas as screenToCanvasUtil } from '@/utils/geometryUtils'

const MIN_SCALE = 0.2
const MAX_SCALE = 3

interface CanvasStore extends CanvasState {
  setScale: (scale: number, center?: Point) => void
  setOffset: (x: number, y: number) => void
  adjustOffset: (dx: number, dy: number) => void
  setFocusedBubble: (id: string | null) => void
  resetView: () => void
  screenToCanvas: (screenX: number, screenY: number) => Point
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  focusedBubbleId: null,

  setScale: (newScale, center) => {
    const clampedScale = clamp(newScale, MIN_SCALE, MAX_SCALE)
    if (!center) {
      set({ scale: clampedScale })
      return
    }
    const state = get()
    const oldScale = state.scale
    if (oldScale === clampedScale) return
    const { x: cx, y: cy } = center
    const newOffsetX = cx - (cx - state.offsetX) * (clampedScale / oldScale)
    const newOffsetY = cy - (cy - state.offsetY) * (clampedScale / oldScale)
    set({
      scale: clampedScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY
    })
  },

  setOffset: (x, y) => set({ offsetX: x, offsetY: y }),

  adjustOffset: (dx, dy) => set(state => ({
    offsetX: state.offsetX + dx,
    offsetY: state.offsetY + dy
  })),

  setFocusedBubble: (id) => set({ focusedBubbleId: id }),

  resetView: () => set({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    focusedBubbleId: null
  }),

  screenToCanvas: (screenX, screenY) => {
    const { scale, offsetX, offsetY } = get()
    return screenToCanvasUtil(screenX, screenY, scale, offsetX, offsetY)
  }
}))
