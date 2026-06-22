import { create } from 'zustand'
import type { Bubble } from '@/types'
import { getRandomColor } from '@/utils/colorUtils'
import { generateId } from '@/utils/geometryUtils'

const DEFAULT_SIZE = 80

interface BubbleStore {
  bubbles: Bubble[]
  addBubble: (x: number, y: number, size?: number, color?: string) => Bubble
  updateBubble: (id: string, patch: Partial<Bubble>) => void
  removeBubble: (id: string) => void
  getBubbleById: (id: string) => Bubble | undefined
  setBubbles: (bubbles: Bubble[]) => void
  clearAll: () => void
}

export const useBubbleStore = create<BubbleStore>((set, get) => ({
  bubbles: [],

  addBubble: (x, y, size = DEFAULT_SIZE, color) => {
    const newBubble: Bubble = {
      id: generateId(),
      x,
      y,
      size,
      color: color || getRandomColor(),
      text: ''
    }
    set(state => ({ bubbles: [...state.bubbles, newBubble] }))
    return newBubble
  },

  updateBubble: (id, patch) => set(state => ({
    bubbles: state.bubbles.map(b =>
      b.id === id ? { ...b, ...patch } : b
    )
  })),

  removeBubble: (id) => set(state => ({
    bubbles: state.bubbles.filter(b => b.id !== id)
  })),

  getBubbleById: (id) => get().bubbles.find(b => b.id === id),

  setBubbles: (bubbles) => set({ bubbles }),

  clearAll: () => set({ bubbles: [] })
}))
