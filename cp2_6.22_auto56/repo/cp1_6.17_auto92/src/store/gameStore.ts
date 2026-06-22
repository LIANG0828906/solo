import { create } from 'zustand'

export type RuneType = 'fire' | 'ice' | 'thunder' | 'life' | 'shadow'

export type SceneType = 'forest' | 'desert' | 'starry'

export interface Rune {
  id: string
  type: RuneType
  name: string
  color: string
  innerGlow: string
  frequency: number
}

export interface PortalActivationCommand {
  valid: boolean
  scene?: SceneType
  message: string
}

interface GameState {
  selectedRunes: Rune[]
  currentScene: SceneType
  totalCombinations: number
  successfulCombinations: number
  consecutiveErrors: number
  hintRuneId: string | null
  isPortalActive: boolean
  isTransitioning: boolean
  lastErrorCombination: Rune[] | null
  isInteractionDisabled: boolean

  addRune: (rune: Rune) => void
  removeRune: (index: number) => void
  clearRunes: () => void
  setCurrentScene: (scene: SceneType) => void
  incrementCombinations: (success: boolean) => void
  setConsecutiveErrors: (count: number) => void
  setHintRuneId: (id: string | null) => void
  setPortalActive: (active: boolean) => void
  setTransitioning: (transitioning: boolean) => void
  setLastErrorCombination: (runes: Rune[] | null) => void
  setInteractionDisabled: (disabled: boolean) => void
  resetConsecutiveErrors: () => void
}

export const RUNES: Rune[] = [
  { id: 'fire-1', type: 'fire', name: '火焰符文', color: '#FF4500', innerGlow: '#FF6347', frequency: 440 },
  { id: 'ice-1', type: 'ice', name: '冰霜符文', color: '#00BFFF', innerGlow: '#87CEEB', frequency: 523 },
  { id: 'thunder-1', type: 'thunder', name: '雷电符文', color: '#FFD700', innerGlow: '#FFFACD', frequency: 659 },
  { id: 'life-1', type: 'life', name: '生命符文', color: '#32CD32', innerGlow: '#98FB98', frequency: 784 },
  { id: 'shadow-1', type: 'shadow', name: '暗影符文', color: '#8A2BE2', innerGlow: '#9370DB', frequency: 880 },
  { id: 'fire-2', type: 'fire', name: '火焰符文', color: '#FF4500', innerGlow: '#FF6347', frequency: 440 },
  { id: 'ice-2', type: 'ice', name: '冰霜符文', color: '#00BFFF', innerGlow: '#87CEEB', frequency: 523 },
  { id: 'shadow-2', type: 'shadow', name: '暗影符文', color: '#8A2BE2', innerGlow: '#9370DB', frequency: 880 },
  { id: 'thunder-2', type: 'thunder', name: '雷电符文', color: '#FFD700', innerGlow: '#FFFACD', frequency: 659 }
]

export const useGameStore = create<GameState>((set) => ({
  selectedRunes: [],
  currentScene: 'forest',
  totalCombinations: 0,
  successfulCombinations: 0,
  consecutiveErrors: 0,
  hintRuneId: null,
  isPortalActive: false,
  isTransitioning: false,
  lastErrorCombination: null,
  isInteractionDisabled: false,

  addRune: (rune) =>
    set((state) => {
      if (state.selectedRunes.length >= 3) return state
      return { selectedRunes: [...state.selectedRunes, rune] }
    }),

  removeRune: (index) =>
    set((state) => ({
      selectedRunes: state.selectedRunes.filter((_, i) => i !== index)
    })),

  clearRunes: () => set({ selectedRunes: [] }),

  setCurrentScene: (scene) => set({ currentScene: scene }),

  incrementCombinations: (success) =>
    set((state) => ({
      totalCombinations: state.totalCombinations + 1,
      successfulCombinations: state.successfulCombinations + (success ? 1 : 0),
      consecutiveErrors: success ? 0 : state.consecutiveErrors + 1
    })),

  setConsecutiveErrors: (count) => set({ consecutiveErrors: count }),

  setHintRuneId: (id) => set({ hintRuneId: id }),

  setPortalActive: (active) => set({ isPortalActive: active }),

  setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),

  setLastErrorCombination: (runes) => set({ lastErrorCombination: runes }),

  setInteractionDisabled: (disabled) => set({ isInteractionDisabled: disabled }),

  resetConsecutiveErrors: () => set({ consecutiveErrors: 0 })
}))
