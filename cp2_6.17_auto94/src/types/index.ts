export type CellType = 'wall' | 'floor' | 'treasure' | 'exit'

export interface Position {
  x: number
  y: number
}

export interface Skill {
  name: string
  type: 'damage' | 'heal' | 'buff'
  value: number
  cooldown: number
  currentCooldown: number
}

export interface Buff {
  type: 'attack' | 'defense'
  value: number
  remainingTurns: number
}

export interface Unit {
  id: string
  name: string
  position: Position
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  skills: Skill[]
}

export interface Hero extends Unit {
  type: 'warrior' | 'mage' | 'cleric'
  activeBuffs: Buff[]
}

export interface Monster extends Unit {
  aiState: 'patrol' | 'chase' | 'attack'
}

export interface Item {
  type: 'heal_potion' | 'power_potion' | 'shield_potion'
  value: number
  duration?: number
}

export type GameStatus = 'playing' | 'won' | 'lost'

export interface AnimationEffect {
  id: string
  type: 'attack' | 'damage' | 'heal' | 'buff' | 'item'
  position: Position
  targetId?: string
  value?: number
  createdAt: number
}

export interface GameState {
  maze: CellType[][]
  heroes: Hero[]
  monsters: Monster[]
  turn: number
  selectedHeroId: string | null
  battleLog: string[]
  gameStatus: GameStatus
  animationEffects: AnimationEffect[]
}
