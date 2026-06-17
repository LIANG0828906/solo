export type CellType = 'wall' | 'floor' | 'treasure' | 'exit'

export interface Position {
  x: number
  y: number
}

export interface Skill {
  name: string
  type: 'damage' | 'heal' | 'buff'
  value: number
  power: number
  cooldown: number
  currentCooldown: number
}

export interface Buff {
  id: string
  name: string
  type: 'attack' | 'defense'
  stat: 'attack' | 'defense'
  value: number
  remainingTurns: number
  duration: number
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
  buffs: Buff[]
}

export interface Hero extends Unit {
  type: 'warrior' | 'mage' | 'cleric'
  activeBuffs: Buff[]
  level: number
  experience: number
  gold: number
  inventory: Item[]
}

export interface Monster extends Unit {
  aiState: 'patrol' | 'chase' | 'attack'
  expReward: number
  goldReward: number
  loot: Item[]
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

export interface BattleResult {
  attackerId: string
  defenderId: string
  damageDealt: number
  damage: number
  isCritical: boolean
  defenderDied: boolean
  targetDefeated: boolean
  targetHp: number
  expGained?: number
  goldGained?: number
  loot?: Item[]
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

export interface GameActions {
  selectHero: (id: string | null) => void
  moveHero: (heroId: string, position: Position) => void
  attackMonster: (heroId: string, monsterId: string) => void
  addLog: (message: string) => void
  addBattleLog: (message: string) => void
  setGameStatus: (status: GameStatus) => void
  updateGameStatus: (status: GameStatus) => void
  resetGame: () => void
  initGame: () => void
  setMaze: (maze: CellType[][]) => void
  setMonsters: (monsters: Monster[]) => void
  updateHero: (heroId: string, updates: Partial<Hero>) => void
  updateMonster: (monsterId: string, updates: Partial<Monster>) => void
  removeMonster: (monsterId: string) => void
  applyItem: (heroId: string, item: Item) => void
  tickBuffs: () => void
  incrementTurn: () => void
  addAnimationEffect: (effect: Omit<AnimationEffect, 'id' | 'createdAt'>) => void
  setEngineResetCallback?: (cb: () => void) => void
}
