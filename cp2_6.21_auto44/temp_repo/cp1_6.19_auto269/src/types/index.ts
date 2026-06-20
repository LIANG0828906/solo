export type Faction = 'light' | 'dark'

export type Element = 'fire' | 'ice' | 'thunder' | 'dark'

export type UnitType = 'warrior' | 'mage' | 'archer' | 'assassin' | 'priest' | 'warlock'

export type EventType = 'fire_trap' | 'ice_zone' | 'thunder_storm' | 'shadow_mist' | null

export interface Position {
  x: number
  y: number
}

export interface Skill {
  id: string
  name: string
  mpCost: number
  damage: number
  range: number
  effect: string
  description: string
}

export interface Unit {
  id: string
  name: string
  faction: Faction
  element: Element
  type: UnitType
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  attack: number
  defense: number
  moveRange: number
  attackRange: number
  x: number
  y: number
  isAlive: boolean
  skills: Skill[]
  hasMoved: boolean
  hasAttacked: boolean
}

export interface Cell {
  x: number
  y: number
  eventType: EventType
  eventDuration: number
  tombstoneUnitId: string | null
  tombstoneTurns: number
  tombstoneFaction: Faction | null
}

export interface Board {
  size: number
  cells: Cell[][]
}

export interface EventConfig {
  type: EventType
  name: string
  description: string
  weight: number
  duration: number
}

export interface EventResult {
  type: EventType
  positions: Position[]
  duration: number
}

export interface BattleResult {
  damage: number
  isCritical: boolean
  elementMultiplier: number
  targetDefeated: boolean
  effectType: 'fire_burst' | 'ice_shard' | 'lightning' | 'shadow_devour' | null
}

export interface BattleEffect {
  id: string
  type: 'fire_burst' | 'ice_shard' | 'lightning' | 'shadow_devour' | 'damage_number'
  x: number
  y: number
  targetX?: number
  targetY?: number
  damage?: number
  createdAt: number
}

export interface GameState {
  board: Board
  units: Unit[]
  currentTurn: number
  currentPlayer: Faction
  selectedUnitId: string | null
  movablePositions: Position[]
  attackablePositions: Position[]
  mana: Record<Faction, number>
  maxMana: Record<Faction, number>
  gameStatus: 'playing' | 'ended'
  winner: Faction | null
  battleEffects: BattleEffect[]
  gameStartTime: number
  activeEvent: EventResult | null
}

export interface GameActions {
  selectUnit: (unitId: string | null) => void
  moveUnit: (unitId: string, x: number, y: number) => void
  attackUnit: (attackerId: string, defenderId: string) => void
  useSkill: (attackerId: string, defenderId: string, skillId: string) => void
  endTurn: () => void
  startNewGame: () => void
  clearBattleEffect: (effectId: string) => void
}
