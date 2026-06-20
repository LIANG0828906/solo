export enum RuneType {
  FIRE = 'fire',
  ICE = 'ice',
  THUNDER = 'thunder',
  EARTH = 'earth',
  WIND = 'wind',
  SHADOW = 'shadow'
}

export interface RuneData {
  type: RuneType
  name: string
  color: string
  symbol: string
}

export enum ItemType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  ACCESSORY = 'accessory'
}

export enum ItemQuality {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export interface CraftedItem {
  id: string
  name: string
  type: ItemType
  quality: ItemQuality
  primaryElement: RuneType
  attack?: number
  defense?: number
  cooldownReduction?: number
  elementDamage?: number
  elementResistance?: number
  runeSequence: RuneType[]
  temperature: number
  craftTime: number
}

export interface Recipe {
  runes: RuneType[]
  itemType: ItemType
  quality: ItemQuality
  name: string
  baseStats: {
    attack?: number
    defense?: number
    cooldownReduction?: number
    elementDamage?: number
    elementResistance?: number
  }
}

export type RecipeDictionary = Recipe[]

export interface ForgeState {
  runeSequence: RuneType[]
  temperature: number
  isForging: boolean
  forgeStartTime: number
  forgeDuration: number
  craftedItems: CraftedItem[]
  currentHint: string
}
