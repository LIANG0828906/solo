import { create } from 'zustand'
import { WordBlock, CanvasTransform, EmotionCategory, EMOTION_COLORS, AnimationType } from '@/types'

interface ArtState {
  wordBlocks: WordBlock[]
  selectedBlockId: string | null
  canvasTransform: CanvasTransform
  activeAnimationWheel: string | null

  addWordBlock: (text: string, category: EmotionCategory, x: number, y: number) => void
  updateWordBlock: (id: string, updates: Partial<WordBlock>) => void
  deleteWordBlock: (id: string) => void
  setSelectedBlockId: (id: string | null) => void
  setCanvasTransform: (transform: Partial<CanvasTransform>) => void
  setActiveAnimationWheel: (id: string | null) => void
  setAnimation: (id: string, animation: AnimationType) => void
}

let blockIdCounter = 0

export const useArtStore = create<ArtState>((set) => ({
  wordBlocks: [],
  selectedBlockId: null,
  canvasTransform: {
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
  },
  activeAnimationWheel: null,

  addWordBlock: (text, category, x, y) => {
    const id = `block-${++blockIdCounter}`
    const newBlock: WordBlock = {
      id,
      text,
      x,
      y,
      color: EMOTION_COLORS[category],
      fontSize: 32,
      fontWeight: 400,
      animation: null,
      emotionCategory: category,
    }
    set((state) => ({
      wordBlocks: [...state.wordBlocks, newBlock],
      selectedBlockId: id,
    }))
  },

  updateWordBlock: (id, updates) =>
    set((state) => ({
      wordBlocks: state.wordBlocks.map((block) =>
        block.id === id ? { ...block, ...updates } : block
      ),
    })),

  deleteWordBlock: (id) =>
    set((state) => ({
      wordBlocks: state.wordBlocks.filter((block) => block.id !== id),
      selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
      activeAnimationWheel: state.activeAnimationWheel === id ? null : state.activeAnimationWheel,
    })),

  setSelectedBlockId: (id) => set({ selectedBlockId: id, activeAnimationWheel: null }),

  setCanvasTransform: (transform) =>
    set((state) => ({
      canvasTransform: { ...state.canvasTransform, ...transform },
    })),

  setActiveAnimationWheel: (id) => set({ activeAnimationWheel: id }),

  setAnimation: (id, animation) =>
    set((state) => ({
      wordBlocks: state.wordBlocks.map((block) =>
        block.id === id ? { ...block, animation } : block
      ),
      activeAnimationWheel: null,
    })),
}))
