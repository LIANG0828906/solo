import { create } from 'zustand'

type Rarity = 'common' | 'rare' | 'epic'
type WeaponType = 'sword' | 'shield' | 'bow' | 'staff'

interface Material {
  id: string
  name: string
  icon: string
  rarity: Rarity
  description: string
  lore: string
  baseProperties: Record<string, number>
  quantity: number
}

interface Recipe {
  id: string
  name: string
  materialIds: string[]
  productType: 'potion' | 'ore'
  productName: string
  effect: string
  effectValue: number
  effectType: string
  description: string
  discovered: boolean
  isFavorite: boolean
}

interface Weapon {
  id: string
  name: string
  type: WeaponType
  baseAttack: number
  baseDefense: number
  enchantments: Enchantment[]
  createdAt: string
}

interface Enchantment {
  name: string
  type: string
  value: number
  description: string
}

interface ExperimentResult {
  success: boolean
  recipe?: Recipe
  message: string
}

interface GameState {
  playerId: string | null
  materials: Material[]
  recipes: Recipe[]
  weapons: Weapon[]
  cauldronMaterials: string[]
  isGathering: boolean
  isExperimenting: boolean
  isForging: boolean
  experimentResult: ExperimentResult | null
  forgeConsumable: string | null
  selectedWeaponType: WeaponType | null
}

interface GameActions {
  initializePlayer: () => Promise<void>
  loadPlayer: () => Promise<void>
  loadMaterials: () => Promise<void>
  loadRecipes: () => Promise<void>
  gatherMaterial: () => Promise<void>
  addToCauldron: (materialId: string) => void
  removeFromCauldron: (materialId: string) => void
  clearCauldron: () => void
  experiment: () => Promise<void>
  toggleFavorite: (recipeId: string) => Promise<void>
  setForgeConsumable: (recipeId: string | null) => void
  setSelectedWeaponType: (type: WeaponType | null) => void
  forgeWeapon: () => Promise<void>
  loadWeapons: () => Promise<void>
}

type GameStore = GameState & GameActions

export const useGameStore = create<GameStore>((set, get) => ({
  playerId: null,
  materials: [],
  recipes: [],
  weapons: [],
  cauldronMaterials: [],
  isGathering: false,
  isExperimenting: false,
  isForging: false,
  experimentResult: null,
  forgeConsumable: null,
  selectedWeaponType: null,

  initializePlayer: async () => {
    const res = await fetch('/api/player', { method: 'POST' })
    const data = await res.json()
    set({
      playerId: data.player.id,
      materials: data.materials ?? [],
      recipes: data.recipes ?? [],
      weapons: data.weapons ?? [],
    })
  },

  loadPlayer: async () => {
    const { playerId } = get()
    if (!playerId) return
    const res = await fetch(`/api/player/${playerId}`)
    const data = await res.json()
    set({
      materials: data.materials ?? [],
      recipes: data.recipes ?? [],
      weapons: data.weapons ?? [],
    })
  },

  loadMaterials: async () => {
    const res = await fetch('/api/materials')
    const materials = await res.json()
    set({ materials })
  },

  loadRecipes: async () => {
    const res = await fetch('/api/recipes')
    const recipes = await res.json()
    set({ recipes })
  },

  gatherMaterial: async () => {
    const { playerId, isGathering } = get()
    if (isGathering || !playerId) return
    set({ isGathering: true })
    try {
      const res = await fetch('/api/materials/gather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      })
      const data = await res.json()
      set({ materials: data.materials ?? data })
    } finally {
      setTimeout(() => set({ isGathering: false }), 2000)
    }
  },

  addToCauldron: (materialId: string) => {
    const { cauldronMaterials } = get()
    if (cauldronMaterials.length >= 3 || cauldronMaterials.includes(materialId)) return
    set({ cauldronMaterials: [...cauldronMaterials, materialId] })
  },

  removeFromCauldron: (materialId: string) => {
    set({ cauldronMaterials: get().cauldronMaterials.filter((id) => id !== materialId) })
  },

  clearCauldron: () => {
    set({ cauldronMaterials: [] })
  },

  experiment: async () => {
    const { playerId, cauldronMaterials, isExperimenting } = get()
    if (isExperimenting || cauldronMaterials.length === 0 || !playerId) return
    set({ isExperimenting: true, experimentResult: null })
    try {
      const res = await fetch('/api/recipes/experiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, materialIds: cauldronMaterials }),
      })
      const data = await res.json()
      const result: ExperimentResult = {
        success: data.success,
        recipe: data.recipe,
        message: data.message,
      }
      if (data.success) {
        await get().loadRecipes()
      }
      await get().loadMaterials()
      set({ cauldronMaterials: [], experimentResult: result })
    } catch {
      set({ cauldronMaterials: [], experimentResult: { success: false, message: '实验失败' } })
    } finally {
      setTimeout(() => set({ isExperimenting: false }), 3000)
    }
  },

  toggleFavorite: async (recipeId: string) => {
    const { playerId } = get()
    if (!playerId) return
    await fetch('/api/recipes/favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, recipeId }),
    })
    set({
      recipes: get().recipes.map((r) =>
        r.id === recipeId ? { ...r, isFavorite: !r.isFavorite } : r
      ),
    })
  },

  setForgeConsumable: (recipeId: string | null) => {
    set({ forgeConsumable: recipeId })
  },

  setSelectedWeaponType: (type: WeaponType | null) => {
    set({ selectedWeaponType: type })
  },

  forgeWeapon: async () => {
    const { playerId, forgeConsumable, selectedWeaponType, isForging } = get()
    if (isForging || !playerId || !forgeConsumable || !selectedWeaponType) return
    set({ isForging: true })
    try {
      const res = await fetch('/api/forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, recipeId: forgeConsumable, weaponType: selectedWeaponType }),
      })
      if (res.ok) {
        await get().loadWeapons()
        await get().loadPlayer()
      }
    } finally {
      setTimeout(() => set({ isForging: false }), 2000)
    }
  },

  loadWeapons: async () => {
    const { playerId } = get()
    if (!playerId) return
    const res = await fetch(`/api/weapons/${playerId}`)
    const weapons = await res.json()
    set({ weapons })
  },
}))
