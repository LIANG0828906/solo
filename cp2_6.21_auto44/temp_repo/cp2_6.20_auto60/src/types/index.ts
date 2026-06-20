export type ElementType = 'fire' | 'water' | 'thunder' | 'wind' | 'dark'

export type Rarity = 1 | 2 | 3 | 4 | 5

export type SlotType = 'weapon' | 'offhand' | 'helmet' | 'chest' | 'bracers' | 'ring'

export interface BaseStats {
  attack?: number
  defense?: number
  health?: number
  critRate?: number
}

export interface Fragment {
  id: string
  name: string
  element: ElementType
  rarity: Rarity
  baseStats: BaseStats
  count: number
  lore: string
  craftableRunes: string[]
  dropLocations: string[]
}

export interface Rune {
  id: string
  name: string
  element: ElementType
  rarity: Rarity
  slotType: SlotType
  stats: BaseStats & { specialEffect?: string }
  effectChance: number
  description: string
}

export interface Character {
  id: string
  name: string
  baseHealth: number
  baseAttack: number
  baseDefense: number
  avatar: string
}

export interface EquippedRunes {
  weapon: Rune | null
  offhand: Rune | null
  helmet: Rune | null
  chest: Rune | null
  bracers: Rune | null
  ring: Rune | null
}

export interface BattleRecord {
  id: string
  timestamp: number
  opponent: string
  totalDamage: number
  effectsTriggered: number
  turns: number
  victory: boolean
}

export interface BattleState {
  isActive: boolean
  playerHealth: number
  opponentHealth: number
  playerMaxHealth: number
  opponentMaxHealth: number
  currentTurn: 'player' | 'opponent'
  damageNumbers: Array<{ id: string; value: number; x: number; y: number; isPlayer: boolean }>
}
