import { create } from 'zustand'

export type ProcessStep = 'select' | 'arrange' | 'ink' | 'press' | 'reveal'

export type MaterialType = 'wood' | 'clay'

export interface CharacterSlot {
  id: string
  char: string
  position: { row: number; col: number } | null
  inkLevel: number
}

interface PrintState {
  currentStep: ProcessStep
  selectedChar: string | null
  arrangedChars: CharacterSlot[]
  inkConcentration: number
  currentMaterial: MaterialType
  activeRadical: string
  gridSize: { rows: number; cols: number }
  isDragging: boolean
  dragPosition: { x: number; y: number } | null
  brushPosition: { x: number; y: number } | null
  pressProgress: number
  isPrinted: boolean
  soundEffect: string | null
  
  setCurrentStep: (step: ProcessStep) => void
  setSelectedChar: (char: string | null) => void
  setCurrentMaterial: (material: MaterialType) => void
  setActiveRadical: (radical: string) => void
  setIsDragging: (dragging: boolean) => void
  setDragPosition: (pos: { x: number; y: number } | null) => void
  setBrushPosition: (pos: { x: number; y: number } | null) => void
  setPressProgress: (progress: number | ((prev: number) => number)) => void
  setIsPrinted: (printed: boolean) => void
  setSoundEffect: (effect: string | null) => void
  
  addCharacter: (char: string, position: { row: number; col: number }) => void
  removeCharacter: (id: string) => void
  clearAllCharacters: () => void
  applyInk: (amount: number) => void
  resetInk: () => void
  findNearestEmptySlot: (targetRow: number, targetCol: number) => { row: number; col: number } | null
  isPositionOccupied: (row: number, col: number) => boolean
  goToNextStep: () => void
  resetProcess: () => void
}

const RADICAL_GROUPS: Record<string, string[]> = {
  '自然': ['天', '地', '日', '月', '山', '水', '木', '火', '土', '风', '云', '雨', '雪', '星', '河'],
  '人文': ['人', '心', '手', '口', '目', '耳', '头', '身', '家', '国', '文', '武', '书', '画', '诗'],
  '数字': ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '百', '千', '万', '亿', '零'],
  '四季': ['春', '夏', '秋', '冬', '花', '鸟', '虫', '鱼', '草', '树', '林', '森', '石', '玉', '金']
}

export const ALL_CHARACTERS = Object.values(RADICAL_GROUPS).flat()

export const RADICALS = Object.keys(RADICAL_GROUPS)

export const getCharactersByRadical = (radical: string): string[] => {
  return RADICAL_GROUPS[radical] || []
}

export const usePrintStore = create<PrintState>((set, get) => ({
  currentStep: 'select',
  selectedChar: null,
  arrangedChars: [],
  inkConcentration: 0,
  currentMaterial: 'wood',
  activeRadical: '自然',
  gridSize: { rows: 8, cols: 8 },
  isDragging: false,
  dragPosition: null,
  brushPosition: null,
  pressProgress: 0,
  isPrinted: false,
  soundEffect: null,

  setCurrentStep: (step) => set({ currentStep: step }),
  setSelectedChar: (char) => set({ selectedChar: char }),
  setCurrentMaterial: (material) => set({ currentMaterial: material }),
  setActiveRadical: (radical) => set({ activeRadical: radical }),
  setIsDragging: (dragging) => set({ isDragging: dragging }),
  setDragPosition: (pos) => set({ dragPosition: pos }),
  setBrushPosition: (pos) => set({ brushPosition: pos }),
  setPressProgress: (progress) => 
    set((state) => ({ 
      pressProgress: typeof progress === 'function' ? progress(state.pressProgress) : progress 
    })),
  setIsPrinted: (printed) => set({ isPrinted: printed }),
  setSoundEffect: (effect) => {
    set({ soundEffect: effect })
    if (effect) {
      setTimeout(() => set({ soundEffect: null }), 300)
    }
  },

  addCharacter: (char, position) => {
    const { arrangedChars } = get()
    const exists = arrangedChars.some(
      c => c.position?.row === position.row && c.position?.col === position.col
    )
    if (exists) return

    const newSlot: CharacterSlot = {
      id: `${char}-${Date.now()}-${Math.random()}`,
      char,
      position,
      inkLevel: 0
    }
    set({ 
      arrangedChars: [...arrangedChars, newSlot],
      soundEffect: 'wood-drop'
    })
    setTimeout(() => set({ soundEffect: null }), 300)
  },

  removeCharacter: (id) => {
    const { arrangedChars } = get()
    set({ arrangedChars: arrangedChars.filter(c => c.id !== id) })
  },

  clearAllCharacters: () => set({ arrangedChars: [], inkConcentration: 0, isPrinted: false }),

  applyInk: (amount) => {
    const { arrangedChars, inkConcentration } = get()
    const newInkLevel = Math.min(100, inkConcentration + amount)
    set({
      inkConcentration: newInkLevel,
      arrangedChars: arrangedChars.map(c => ({
        ...c,
        inkLevel: Math.min(100, c.inkLevel + amount * 0.8)
      }))
    })
  },

  resetInk: () => {
    const { arrangedChars } = get()
    set({
      inkConcentration: 0,
      arrangedChars: arrangedChars.map(c => ({ ...c, inkLevel: 0 }))
    })
  },

  findNearestEmptySlot: (targetRow, targetCol) => {
    const { gridSize, isPositionOccupied } = get()
    let nearest = null
    let minDist = Infinity

    for (let row = 0; row < gridSize.rows; row++) {
      for (let col = 0; col < gridSize.cols; col++) {
        if (!isPositionOccupied(row, col)) {
          const dist = Math.sqrt(
            Math.pow(row - targetRow, 2) + Math.pow(col - targetCol, 2)
          )
          if (dist < minDist) {
            minDist = dist
            nearest = { row, col }
          }
        }
      }
    }
    return nearest
  },

  isPositionOccupied: (row, col) => {
    const { arrangedChars } = get()
    return arrangedChars.some(
      c => c.position?.row === row && c.position?.col === col
    )
  },

  goToNextStep: () => {
    const { currentStep } = get()
    const steps: ProcessStep[] = ['select', 'arrange', 'ink', 'press', 'reveal']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      set({ currentStep: steps[currentIndex + 1] })
    }
  },

  resetProcess: () => {
    set({
      currentStep: 'select',
      selectedChar: null,
      arrangedChars: [],
      inkConcentration: 0,
      pressProgress: 0,
      isPrinted: false
    })
  }
}))
