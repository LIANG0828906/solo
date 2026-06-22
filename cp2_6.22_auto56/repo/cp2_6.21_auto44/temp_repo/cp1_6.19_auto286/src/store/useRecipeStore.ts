import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export type BaseId = 'espresso' | 'milk' | 'oatMilk' | 'matcha' | 'cocoa' | 'water'
export type SyrupId = 'vanilla' | 'caramel' | 'hazelnut' | 'mint'

export interface FlavorProfile {
  acidity: number
  bitterness: number
  sweetness: number
  body: number
  aroma: number
}

export interface Drink {
  id: string
  name: string
  bases: BaseId[]
  syrups: SyrupId[]
  flavor: FlavorProfile
  cupColor: string
  foamColor: string
  createdAt: number
}

export interface RecipeState {
  currentBases: BaseId[]
  currentSyrups: SyrupId[]
  savedDrinks: Drink[]
  compareIds: string[]
  isBrewing: boolean
  justBrewed: Drink | null
}

const BASE_FLAVOR: Record<BaseId, Partial<FlavorProfile>> = {
  espresso: { acidity: 10, bitterness: 20, body: 15, aroma: 10 },
  milk: { sweetness: 10, body: 10 },
  oatMilk: { sweetness: 8, body: 8, aroma: 3 },
  matcha: { bitterness: 10, aroma: 15, acidity: 5 },
  cocoa: { sweetness: 12, bitterness: 5, aroma: 8 },
  water: {},
}

const SYRUP_FLAVOR: Record<SyrupId, Partial<FlavorProfile>> = {
  vanilla: { sweetness: 12, aroma: 10 },
  caramel: { sweetness: 15, aroma: 5 },
  hazelnut: { sweetness: 8, aroma: 12, body: 5 },
  mint: { aroma: 15, sweetness: 5, acidity: 3 },
}

const CUP_PALETTE: Record<BaseId, string> = {
  espresso: '#8B4513',
  milk: '#F5DEB3',
  oatMilk: '#D4A574',
  matcha: '#6B8E23',
  cocoa: '#CD853F',
  water: '#E8E8E8',
}

const BASE_NAMES: Record<BaseId, string> = {
  espresso: '浓缩',
  milk: '牛奶',
  oatMilk: '燕麦奶',
  matcha: '抹茶',
  cocoa: '可可',
  water: '水',
}

const SYRUP_NAMES: Record<SyrupId, string> = {
  vanilla: '香草',
  caramel: '焦糖',
  hazelnut: '榛果',
  mint: '薄荷',
}

export function calculateFlavor(bases: BaseId[], syrups: SyrupId[]): FlavorProfile {
  const result: FlavorProfile = { acidity: 0, bitterness: 0, sweetness: 0, body: 0, aroma: 0 }
  for (const b of bases) {
    const c = BASE_FLAVOR[b]
    if (c.acidity) result.acidity += c.acidity
    if (c.bitterness) result.bitterness += c.bitterness
    if (c.sweetness) result.sweetness += c.sweetness
    if (c.body) result.body += c.body
    if (c.aroma) result.aroma += c.aroma
  }
  for (const s of syrups) {
    const c = SYRUP_FLAVOR[s]
    if (c.acidity) result.acidity += c.acidity
    if (c.bitterness) result.bitterness += c.bitterness
    if (c.sweetness) result.sweetness += c.sweetness
    if (c.body) result.body += c.body
    if (c.aroma) result.aroma += c.aroma
  }
  result.acidity = Math.min(result.acidity, 100)
  result.bitterness = Math.min(result.bitterness, 100)
  result.sweetness = Math.min(result.sweetness, 100)
  result.body = Math.min(result.body, 100)
  result.aroma = Math.min(result.aroma, 100)
  return result
}

export function getCupColor(bases: BaseId[]): string {
  if (bases.length === 0) return '#F5DEB3'
  return CUP_PALETTE[bases[bases.length - 1]]
}

function getFoamColor(bases: BaseId[]): string {
  const hasMilk = bases.includes('milk') || bases.includes('oatMilk')
  return hasMilk ? '#F5DEB3' : '#FFF8DC'
}

export function getDrinkName(bases: BaseId[], syrups: SyrupId[]): string {
  const parts: string[] = []
  for (const b of bases) parts.push(BASE_NAMES[b])
  for (const s of syrups) parts.push(SYRUP_NAMES[s])
  return parts.join('+')
}

const initialState: RecipeState = {
  currentBases: [],
  currentSyrups: [],
  savedDrinks: [],
  compareIds: [],
  isBrewing: false,
  justBrewed: null,
}

export const useRecipeStore = create<RecipeState>()(
  immer((set) => ({
    ...initialState,

    toggleBase: (id: BaseId) =>
      set((state) => {
        const idx = state.currentBases.indexOf(id)
        if (idx >= 0) {
          state.currentBases.splice(idx, 1)
        } else {
          state.currentBases.push(id)
        }
      }),

    toggleSyrup: (id: SyrupId) =>
      set((state) => {
        const idx = state.currentSyrups.indexOf(id)
        if (idx >= 0) {
          state.currentSyrups.splice(idx, 1)
        } else {
          state.currentSyrups.push(id)
        }
      }),

    startBrewing: () =>
      set((state) => {
        state.isBrewing = true
      }),

    finishBrewing: () =>
      set((state) => {
        const drink: Drink = {
          id: crypto.randomUUID(),
          name: getDrinkName(state.currentBases, state.currentSyrups),
          bases: [...state.currentBases],
          syrups: [...state.currentSyrups],
          flavor: calculateFlavor(state.currentBases, state.currentSyrups),
          cupColor: getCupColor(state.currentBases),
          foamColor: getFoamColor(state.currentBases),
          createdAt: Date.now(),
        }
        state.isBrewing = false
        state.justBrewed = drink
        state.currentBases = []
        state.currentSyrups = []
      }),

    saveDrink: () =>
      set((state) => {
        if (state.justBrewed !== null && state.savedDrinks.length < 20) {
          state.savedDrinks.push(state.justBrewed)
          state.justBrewed = null
        }
      }),

    discardDrink: () =>
      set((state) => {
        state.justBrewed = null
      }),

    toggleCompare: (id: string) =>
      set((state) => {
        const idx = state.compareIds.indexOf(id)
        if (idx >= 0) {
          state.compareIds.splice(idx, 1)
        } else if (state.compareIds.length < 3) {
          state.compareIds.push(id)
        }
      }),

    removeDrink: (id: string) =>
      set((state) => {
        const drinkIdx = state.savedDrinks.findIndex((d) => d.id === id)
        if (drinkIdx >= 0) state.savedDrinks.splice(drinkIdx, 1)
        const compareIdx = state.compareIds.indexOf(id)
        if (compareIdx >= 0) state.compareIds.splice(compareIdx, 1)
      }),
  }))
)
