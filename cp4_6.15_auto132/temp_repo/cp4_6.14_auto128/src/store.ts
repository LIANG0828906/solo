import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type ToolType = 'platform' | 'spike' | 'coin' | 'goal'

export interface PlatformElement {
  id: string
  type: 'platform'
  x: number
  y: number
  width: number
  height: number
  color: string
  borderRadius: number
}

export interface SpikeElement {
  id: string
  type: 'spike'
  x: number
  y: number
  width: number
  height: number
}

export interface CoinElement {
  id: string
  type: 'coin'
  x: number
  y: number
  radius: number
  collected: boolean
}

export interface GoalElement {
  id: string
  type: 'goal'
  x: number
  y: number
  width: number
  height: number
}

export type LevelElement = PlatformElement | SpikeElement | CoinElement | GoalElement

export type NewPlatformElement = Omit<PlatformElement, 'id'>
export type NewSpikeElement = Omit<SpikeElement, 'id'>
export type NewCoinElement = Omit<CoinElement, 'id'>
export type NewGoalElement = Omit<GoalElement, 'id'>
export type NewLevelElement = NewPlatformElement | NewSpikeElement | NewCoinElement | NewGoalElement

export type PlatformElementUpdates = Partial<Omit<PlatformElement, 'id' | 'type'>>
export type SpikeElementUpdates = Partial<Omit<SpikeElement, 'id' | 'type'>>
export type CoinElementUpdates = Partial<Omit<CoinElement, 'id' | 'type'>>
export type GoalElementUpdates = Partial<Omit<GoalElement, 'id' | 'type'>>
export type LevelElementUpdates = PlatformElementUpdates | SpikeElementUpdates | CoinElementUpdates | GoalElementUpdates

export interface CharacterState {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  onGround: boolean
  startX: number
  startY: number
}

interface EditorState {
  elements: LevelElement[]
  currentTool: ToolType
  score: number
  isPlaying: boolean
  character: CharacterState
  history: LevelElement[][]
  historyIndex: number
  isHit: boolean
  isWin: boolean
  showHalo: boolean
  mousePosition: { x: number; y: number }
  addElement: (element: NewLevelElement) => void
  removeElement: (id: string) => void
  updateElement: (id: string, updates: LevelElementUpdates) => void
  setCurrentTool: (tool: ToolType) => void
  recordSnapshot: () => void
  undo: () => void
  redo: () => void
  setPlaying: (playing: boolean) => void
  resetCharacter: () => void
  updateCharacter: (updates: Partial<CharacterState>) => void
  collectCoin: (id: string) => void
  triggerWin: () => void
  triggerHit: () => void
  triggerHalo: () => void
  setMousePosition: (x: number, y: number) => void
  resetScore: () => void
  resetCoins: () => void
}

const MAX_HISTORY = 5

const initialCharacter: CharacterState = {
  x: 100,
  y: 400,
  vx: 0,
  vy: 0,
  width: 32,
  height: 32,
  onGround: false,
  startX: 100,
  startY: 400,
}

export const useEditorStore = create<EditorState>((set, get) => ({
  elements: [],
  currentTool: 'platform',
  score: 0,
  isPlaying: false,
  character: initialCharacter,
  history: [[]],
  historyIndex: 0,
  isHit: false,
  isWin: false,
  showHalo: false,
  mousePosition: { x: 0, y: 0 },

  addElement: (element) => {
    const newElement = { ...element, id: uuidv4() } as LevelElement
    set((state) => ({
      elements: [...state.elements, newElement],
    }))
    get().recordSnapshot()
    get().triggerHalo()
  },

  removeElement: (id) => {
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
    }))
    get().recordSnapshot()
    get().triggerHalo()
  },

  updateElement: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } as LevelElement : el
      ),
    }))
  },

  setCurrentTool: (tool) => {
    set({ currentTool: tool })
    get().triggerHalo()
  },

  recordSnapshot: () => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push(JSON.parse(JSON.stringify(state.elements)))
      if (newHistory.length > MAX_HISTORY + 1) {
        newHistory.shift()
        return {
          history: newHistory,
          historyIndex: newHistory.length - 1,
        }
      }
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }
    })
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex <= 0) return state
      const newIndex = state.historyIndex - 1
      return {
        elements: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
      }
    })
    get().triggerHalo()
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state
      const newIndex = state.historyIndex + 1
      return {
        elements: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
      }
    })
    get().triggerHalo()
  },

  setPlaying: (playing) => {
    set((state) => ({
      isPlaying: playing,
      character: {
        ...state.character,
        x: state.character.startX,
        y: state.character.startY,
        vx: 0,
        vy: 0,
      },
      isWin: false,
      isHit: false,
    }))
    if (playing) {
      get().resetCoins()
      get().resetScore()
    }
  },

  resetCharacter: () => {
    set((state) => ({
      character: {
        ...state.character,
        x: state.character.startX,
        y: state.character.startY,
        vx: 0,
        vy: 0,
        onGround: false,
      },
    }))
  },

  updateCharacter: (updates) => {
    set((state) => ({
      character: { ...state.character, ...updates },
    }))
  },

  collectCoin: (id) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id && el.type === 'coin' ? { ...el, collected: true } : el
      ),
      score: state.score + 1,
    }))
  },

  triggerWin: () => {
    set({ isWin: true })
    setTimeout(() => {
      set({ isWin: false, isPlaying: false })
    }, 1500)
  },

  triggerHit: () => {
    set({ isHit: true })
    setTimeout(() => {
      set({ isHit: false })
      get().resetCharacter()
    }, 300)
  },

  triggerHalo: () => {
    set({ showHalo: true })
    setTimeout(() => {
      set({ showHalo: false })
    }, 200)
  },

  setMousePosition: (x, y) => {
    set({ mousePosition: { x, y } })
  },

  resetScore: () => {
    set({ score: 0 })
  },

  resetCoins: () => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.type === 'coin' ? { ...el, collected: false } : el
      ),
    }))
  },
}))
