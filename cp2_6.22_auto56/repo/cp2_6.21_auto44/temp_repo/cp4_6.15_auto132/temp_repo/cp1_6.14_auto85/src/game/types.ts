export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
export type Skill = 'combo' | 'taunt' | 'heal'
export type Owner = 'player' | 'enemy'
export type CellZone = 'player' | 'enemy' | 'neutral'
export type Phase = 'player' | 'enemy' | 'ended'

export interface Card {
  id: string
  name: string
  cost: number
  attack: number
  health: number
  maxHealth: number
  rarity: Rarity
  skill?: Skill
  skillValue?: number
  owner: Owner
  position?: { row: number; col: number }
  canAttack: boolean
  justPlaced: boolean
}

export interface GridCell {
  row: number
  col: number
  zone: CellZone
  card: Card | null
  isHighlighted: boolean
  isValidTarget: boolean
}

export interface GameStats {
  playerDamage: number
  enemyDamage: number
  playerKills: number
  enemyKills: number
  playerHeal: number
  enemyHeal: number
}

export interface GameState {
  turn: number
  phase: Phase
  winner: Owner | null

  playerHealth: number
  playerMaxHealth: number
  playerMana: number
  playerMaxMana: number
  playerHealthDamaged: boolean

  enemyHealth: number
  enemyMaxHealth: number
  enemyMana: number
  enemyMaxMana: number
  enemyHealthDamaged: boolean

  playerHand: Card[]
  enemyHand: Card[]
  playerDeck: Card[]
  enemyDeck: Card[]

  grid: GridCell[][]

  stats: GameStats
}

export interface FloatingText {
  id: string
  text: string
  x: number
  y: number
  color: string
  createdAt: number
}

export interface Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  life: number
  maxLife: number
}

export type DamageEvent = {
  targetCardId?: string
  targetOwner?: Owner
  amount: number
  isHeal?: boolean
}
