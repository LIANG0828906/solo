export type SkillType = 'fireball' | 'iceshield' | 'lightning'
export type CellState = null | 'fire' | 'ice' | 'lightning'

export interface Position {
  row: number
  col: number
}

export interface Player {
  id: 1 | 2
  name: string
  hp: number
  maxHp: number
  position: Position
  cooldowns: Record<SkillType, number>
  hasIceShield?: boolean
}

export interface GameState {
  roomId: string
  currentTurn: 1 | 2
  turnPhase: 'move' | 'skill' | 'waiting'
  turnTimer: number
  players: [Player, Player]
  gridState: CellState[][]
  winner: null | 1 | 2
}

export interface SkillEffectEvent {
  skillType: SkillType
  targetCell: Position
  playerId: 1 | 2
  timestamp: number
}

export interface HpChangeEvent {
  playerId: 1 | 2
  newHp: number
  delta: number
}

export interface TurnTimeoutEvent {
  skipPlayerId: 1 | 2
}

export const SKILL_CONFIG: Record<
  SkillType,
  {
    name: string
    damage: number
    cooldown: number
    icon: string
    duration: number
  }
> = {
  fireball: { name: '火球', damage: 25, cooldown: 2, icon: '🔥', duration: 400 },
  iceshield: { name: '冰盾', damage: 0, cooldown: 3, icon: '🛡️', duration: 600 },
  lightning: { name: '闪电', damage: 35, cooldown: 3, icon: '⚡', duration: 300 },
}

export const GRID_SIZE = 5
export const CELL_SIZE = 60
export const TURN_DURATION = 5
