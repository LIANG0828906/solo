export interface Vector2D {
  x: number
  y: number
}

export type EntityType = 'player' | 'enemy' | 'playerBullet' | 'enemyBullet' | 'particle'

export type EnemyType = 'normal' | 'elite' | 'boss'

export interface BaseEntity {
  id: number
  type: EntityType
  position: Vector2D
  velocity: Vector2D
  width: number
  height: number
  rotation: number
  active: boolean
}

export interface PlayerEntity extends BaseEntity {
  type: 'player'
  invincible: boolean
  invincibleTimer: number
  shootCooldown: number
}

export interface EnemyEntity extends BaseEntity {
  type: 'enemy'
  enemyType: EnemyType
  hp: number
  maxHp: number
  hitFlashTimer: number
  shootTimer: number
  aiPhase: number
  aiTimer: number
  baseX: number
}

export interface BulletEntity extends BaseEntity {
  type: 'playerBullet' | 'enemyBullet'
  damage: number
  color: string
  radius: number
}

export interface ParticleEntity extends BaseEntity {
  type: 'particle'
  color: string
  lifetime: number
  maxLifetime: number
  size: number
}

export type GameEntity = PlayerEntity | EnemyEntity | BulletEntity | ParticleEntity

export interface CollisionEvent {
  entityA: GameEntity
  entityB: GameEntity
}

export interface Star {
  x: number
  y: number
  size: number
  alpha: number
  speed: number
}
