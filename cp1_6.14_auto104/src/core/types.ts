export type RobotType = 'scout' | 'attacker' | 'tank'
export type CommandType =
  | 'forward'
  | 'backward'
  | 'turnLeft'
  | 'turnRight'
  | 'attack'
  | 'defend'
  | 'scan'
export type Direction = 0 | 1 | 2 | 3
export type ObstacleType = 'metalCrate' | 'energySupply'
export type GamePhase = 'lobby' | 'playing' | 'paused' | 'replay' | 'ended'

export interface RobotStats {
  maxHp: number
  speed: number
  attack: number
  range: number
  viewRange: number
}

export interface Robot {
  id: string
  name: string
  type: RobotType
  x: number
  y: number
  direction: Direction
  hp: number
  stats: RobotStats
  isPlayer: boolean
  commands: CommandType[]
  isDefending: boolean
  isHit: boolean
  scannedEnemies: string[]
  color: string
  trail: Array<{ x: number; y: number; turn: number }>
  totalDamage: number
  survivedTurns: number
}

export interface Obstacle {
  id: string
  type: ObstacleType
  x: number
  y: number
  hp?: number
  value?: number
}

export interface GridCell {
  x: number
  y: number
  robotId?: string
  obstacle?: Obstacle
}

export type BattleEvent =
  | { type: 'move'; robotId: string; from: [number, number]; to: [number, number]; turn: number }
  | { type: 'turn'; robotId: string; from: Direction; to: Direction; turn: number }
  | {
      type: 'attack'
      attackerId: string
      targetId: string
      damage: number
      bulletPath: [number, number][]
      turn: number
    }
  | { type: 'defend'; robotId: string; turn: number }
  | { type: 'scan'; robotId: string; foundIds: string[]; turn: number }
  | { type: 'pickup'; robotId: string; supplyId: string; value: number; turn: number }
  | { type: 'destroy'; robotId: string; turn: number }
  | {
      type: 'hit'
      robotId: string
      damage: number
      isDefending: boolean
      turn: number
    }
  | { type: 'obstacleDestroyed'; obstacleId: string; turn: number }

export interface TurnSnapshot {
  turn: number
  robots: Robot[]
  obstacles: Obstacle[]
  events: BattleEvent[]
  executingIndex: number
  activeRobotId?: string
}

export interface CommandMeta {
  type: CommandType
  label: string
  labelCn: string
  icon: string
  color: string
  description: string
}

export interface RobotTypeMeta {
  type: RobotType
  name: string
  nameCn: string
  description: string
  stats: RobotStats
  color: string
  accentColor: string
}

export interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}
