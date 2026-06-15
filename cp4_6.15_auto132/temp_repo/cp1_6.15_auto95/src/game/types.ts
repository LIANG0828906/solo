export interface Room {
  id: string
  x: number
  y: number
  width: number
  height: number
  connections: string[]
  isEntrance: boolean
  isExit: boolean
  hasChest: boolean
  enemyCount: number
}

export interface Corridor {
  from: string
  to: string
  points: { x: number; y: number }[]
}

export interface EnemyConfig {
  type: 'skeleton' | 'ghost' | 'demon' | 'boss'
  name: string
  hp: number
  attack: number
  defense: number
  speed: number
  attackRange: number
  attackInterval: number
}

export interface LootItem {
  id: string
  name: string
  type: 'weapon' | 'armor' | 'accessory'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  stats: {
    attackBonus?: number
    hpBonus?: number
    energyRegenBonus?: number
  }
  description: string
}

export interface DungeonGenerateResponse {
  seed: number
  floor: number
  rooms: Room[]
  corridors: Corridor[]
  enemies: EnemyConfig[]
  loot: LootItem[]
}

export interface PlayerState {
  hp: number
  maxHp: number
  energy: number
  maxEnergy: number
  energyRegen: number
  attack: number
  defense: number
  level: number
  floor: number
  gold: number
  inventory: LootItem[]
  equippedWeapon: LootItem | null
  equippedArmor: LootItem | null
  equippedAccessory: LootItem | null
  position: { x: number; y: number; z: number }
  isInvincible: boolean
  isAttacking: boolean
  isDead: boolean
}

export interface EnemyState {
  id: string
  type: 'skeleton' | 'ghost' | 'demon' | 'boss'
  name: string
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  position: { x: number; y: number; z: number }
  state: 'patrol' | 'chase' | 'attack' | 'dead'
  attackTimer: number
  attackCooldown: number
  isBoss: boolean
  bossPhase?: number
  roomId: string
  isTelegraphing: boolean
  telegraphTimer: number
}

export interface Particle {
  mesh: any
  life: number
  maxLife: number
  velocity?: { x: number; y: number; z: number }
}

export interface Projectile {
  mesh: any
  direction: { x: number; y: number; z: number }
  speed: number
  life: number
  damage: number
  isPlayerProjectile: boolean
}

export interface GameState {
  player: PlayerState
  enemies: EnemyState[]
  currentFloor: number
  dungeonData: DungeonGenerateResponse | null
  isGameOver: boolean
  isPaused: boolean
  isInGame: boolean
  isInventoryOpen: boolean
  bossHp: number
  bossMaxHp: number
  showBossBar: boolean
  bossName: string
  damageFlash: number
  newLoot: LootItem | null
  messages: string[]
  isTransitioning: boolean
}
