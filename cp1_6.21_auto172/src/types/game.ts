export type CharacterId = 'berserker' | 'ranger' | 'sage'

export interface Skill {
  id: string
  name: string
  cooldown: number
  currentCooldown: number
  damage: number
  range: number
}

export interface CharacterState {
  id: CharacterId
  name: string
  hp: number
  maxHp: number
  skills: Skill[]
  switchCooldown: number
  position: { x: number; y: number }
}

export interface EnemyState {
  id: string
  type: 'minion' | 'boss'
  hp: number
  maxHp: number
  position: { x: number; y: number }
  velocity: { x: number; y: number }
  attackCooldown: number
  damage: number
  alive: boolean
}

export interface ComboRecord {
  comboCount: number
  timestamp: number
  levelId: string
}

export interface HealthTimelinePoint {
  timestamp: number
  hp: number
  maxHp: number
  characterId: CharacterId
}

export interface LevelProgress {
  levelId: string
  currentWave: number
  totalWaves: number
  enemiesRemaining: number
  comboRecord: number
}

export interface AttackEvent {
  characterId: CharacterId
  skillId: string
  damage: number
  timestamp: number
  hitEnemyIds: string[]
}

export interface CharacterContextState {
  activeCharacterId: CharacterId
  characters: Record<CharacterId, CharacterState>
  switchCooldownEnd: number
  isSwitching: boolean
  haloActive: boolean
}

export interface RhythmContextState {
  comboCount: number
  maxCombo: number
  lastAttackTime: number
  comboBroken: boolean
  comboBrokenTime: number
  healthTimeline: HealthTimelinePoint[]
  currentWave: number
  totalWaves: number
  enemiesRemaining: number
  waveTransition: boolean
  waveTransitionTime: number
  screenShake: boolean
  comboMilestone: number
}
