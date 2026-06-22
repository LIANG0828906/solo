export type Rarity = "common" | "rare" | "epic" | "legendary"
export type MaterialCategory = "plant" | "mineral" | "essence"
export type PotionType = "damage" | "heal" | "weaken"

export interface Material {
  id: string
  name: string
  icon: string
  rarity: Rarity
  category: MaterialCategory
  quantity: number
}

export interface Potion {
  id: string
  name: string
  icon: string
  rarity: Rarity
  type: PotionType
  power: number
  description: string
}

export interface Recipe {
  id: string
  name: string
  material1Id: string
  material2Id: string
  product: Potion
  flavorText: string
  discovered: boolean
}

export interface BattleRound {
  playerAction: string
  enemyAction: string
  playerDamage: number
  enemyDamage: number
  playerHeal: number
  enemyHeal: number
  playerHpAfter: number
  enemyHpAfter: number
}

export interface BattleOutcome {
  rounds: BattleRound[]
  logs: string[]
  playerFinalHp: number
  enemyFinalHp: number
  winner: "player" | "enemy" | "draw"
}

export interface RecipeResult {
  success: boolean
  potion: Potion | null
  recipeId: string | null
  isNewDiscovery: boolean
  message: string
}

export interface BattleState {
  playerHp: number
  playerMaxHp: number
  enemyHp: number
  enemyMaxHp: number
  playerPotion: Potion | null
  enemyPotion: Potion | null
  logs: string[]
  phase: "idle" | "fighting" | "finished"
  winner: "player" | "enemy" | "draw" | null
}
