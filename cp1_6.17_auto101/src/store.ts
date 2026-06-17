import { create } from 'zustand'
import type { Material, Recipe, HSLColor, LogLevel } from './GameEngine'
import {
  MATERIALS,
  applyMaterial,
  mixHSLColors,
  getMaterialById,
  checkRecipe,
} from './GameEngine'

export interface LogEntry {
  id: number
  text: string
  level: LogLevel
  timestamp: number
}

export interface CauldronState {
  mixedColor: HSLColor
  isShaking: boolean
  successAnimation: boolean
  currentRecipe: Recipe | null
  triggerSuccess: number
}

export interface AlchemyState {
  selectedMaterials: Material[]
  reactionLog: LogEntry[]
  unlockedRecipes: Recipe[]
  cauldron: CauldronState
  selectedMaterialIds: Set<string>

  addMaterial: (materialId: string) => void
  removeMaterial: (index: number) => void
  clearReaction: () => void
  finishSuccessAnimation: () => void
  toggleMaterialSelection: (materialId: string) => void
  clearMaterialSelection: () => void
}

let logIdCounter = 0

const DEFAULT_COLOR: HSLColor = { h: 20, s: 30, l: 20 }
const SHAKE_THRESHOLD = 3

export const useStore = create<AlchemyState>((set, get) => ({
  selectedMaterials: [],
  reactionLog: [],
  unlockedRecipes: [],
  cauldron: {
    mixedColor: DEFAULT_COLOR,
    isShaking: false,
    successAnimation: false,
    currentRecipe: null,
    triggerSuccess: 0,
  },
  selectedMaterialIds: new Set(),

  addMaterial: (materialId: string) => {
    const state = get()
    const existingIds = state.selectedMaterials.map((m) => m.id)
    const result = applyMaterial(materialId, existingIds)
    const material = getMaterialById(materialId)
    if (!material) return

    const newSelected = [...state.selectedMaterials, material]
    const allColors = newSelected.map((m) => m.color)
    const mixedColor = mixHSLColors(allColors)
    const isShaking = newSelected.length > SHAKE_THRESHOLD

    const newUnlocked = result.matchedRecipe &&
      !state.unlockedRecipes.find((r) => r.id === result.matchedRecipe!.id)
      ? [...state.unlockedRecipes, result.matchedRecipe]
      : state.unlockedRecipes

    const triggerSuccess = result.matchedRecipe
      ? state.cauldron.triggerSuccess + 1
      : state.cauldron.triggerSuccess

    set({
      selectedMaterials: newSelected,
      reactionLog: [
        ...state.reactionLog,
        {
          id: ++logIdCounter,
          text: result.description,
          level: result.level,
          timestamp: Date.now(),
        },
      ],
      unlockedRecipes: newUnlocked,
      cauldron: {
        mixedColor,
        isShaking,
        successAnimation: !!result.matchedRecipe,
        currentRecipe: result.matchedRecipe,
        triggerSuccess,
      },
    })
  },

  removeMaterial: (index: number) => {
    const state = get()
    if (index < 0 || index >= state.selectedMaterials.length) return

    const newSelected = state.selectedMaterials.filter((_, i) => i !== index)
    const allColors = newSelected.map((m) => m.color)
    const mixedColor = newSelected.length > 0 ? mixHSLColors(allColors) : DEFAULT_COLOR
    const isShaking = newSelected.length > SHAKE_THRESHOLD
    const material = state.selectedMaterials[index]

    const newIds = newSelected.map((m) => m.id)
    const stillMatched = checkRecipe(newIds)

    set({
      selectedMaterials: newSelected,
      reactionLog: [
        ...state.reactionLog,
        {
          id: ++logIdCounter,
          text: `从坩埚中取出${material.name}，溶液恢复平衡`,
          level: 'info',
          timestamp: Date.now(),
        },
      ],
      cauldron: {
        mixedColor,
        isShaking,
        successAnimation: !!stillMatched,
        currentRecipe: stillMatched,
        triggerSuccess: state.cauldron.triggerSuccess,
      },
    })
  },

  clearReaction: () => {
    set({
      selectedMaterials: [],
      cauldron: {
        mixedColor: DEFAULT_COLOR,
        isShaking: false,
        successAnimation: false,
        currentRecipe: null,
        triggerSuccess: 0,
      },
      selectedMaterialIds: new Set(),
      reactionLog: [
        ...get().reactionLog,
        {
          id: ++logIdCounter,
          text: '坩埚已清空，准备下一次炼金实验',
          level: 'info',
          timestamp: Date.now(),
        },
      ],
    })
  },

  finishSuccessAnimation: () => {
    set((state) => ({
      cauldron: {
        ...state.cauldron,
        successAnimation: false,
      },
    }))
  },

  toggleMaterialSelection: (materialId: string) => {
    set((state) => {
      const newSet = new Set(state.selectedMaterialIds)
      if (newSet.has(materialId)) {
        newSet.delete(materialId)
      } else {
        newSet.add(materialId)
      }
      return { selectedMaterialIds: newSet }
    })
  },

  clearMaterialSelection: () => {
    set({ selectedMaterialIds: new Set() })
  },
}))

export { MATERIALS }
