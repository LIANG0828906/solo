import {
  GameEntity, PlayerEntity, EnemyEntity, BulletEntity, ParticleEntity,
  EnemyType, CollisionEvent
} from './types'
import {
  createEnemy, createEnemyBullet, updateEnemyAI,
  selectEnemyType, getSpawnInterval, getBossInterval
} from './aiModule'

const PLAYER_SPEED = 300
const SHOOT_COOLDOWN = 0.2
const INVINCIBLE_TIME = 1
const HIT_FLASH_TIME = 0.1
const PARTICLE_LIFETIME = 0.5

export class EntityManager {
  public entities: GameEntity[] = []
  public player: PlayerEntity
  private idCounter = { current: 1 }
  private spawnTimer = 0
  private bossTimer = 0
  private score = 0
  private lives = 3
  private onScoreChange: (score: number) => void = () => {}
  private onLivesChange: (lives: number) => void = () => {}
  private onEnemyBulletSpawn: (x: number, y: number, vx: number, vy: number) => void
  private onPlaySound: (type: 'pew' | 'explosion') => void = () => {}

  constructor(canvasWidth: number, canvasHeight: number) {
    this.player = this.createPlayer(canvasWidth, canvasHeight)
    this.onEnemyBulletSpawn = this.spawnEnemyBullet.bind(this)
  }

  public setCallbacks(
    onScore: (s: number) => void,
    onLives: (l: number) => void,
    onSound: (t: 'pew' | 'explosion') => void
  ) {
    this.onScoreChange = onScore
    this.onLivesChange = onLives
    this.onPlaySound = onSound
  }

  public reset(canvasWidth: number, canvasHeight: number) {
    this.entities = []
    this.idCounter = { current: 1 }
    this.spawnTimer = 0
    this.bossTimer = 0
    this.score = 0
    this.lives = 3
    this.player = this.createPlayer(canvasWidth, canvasHeight)
    this.onScoreChange(0)
    this.onLivesChange(3)
  }

  private createPlayer(cw: number, ch: number): PlayerEntity {
    return {
      id: this.idCounter.current++,
      type: 'player',
      position: { x: cw / 2, y: ch - 80 },
      velocity: { x: 0, y: 0 },
      width: 36,
      height: 40,
      rotation: 0,
      active: true,
      invincible: false,
      invincibleTimer: 0,
      shootCooldown: 0
    }
  }

  public handleInput(input: { up: boolean; down: boolean; left: boolean; right: boolean; shoot: boolean }, dt: number, cw: number, ch: number) {
    const speed = PLAYER_SPEED
    let vx = 0, vy = 0
    if (input.left) vx -= 1
    if (input.right) vx += 1
    if (input.up) vy -= 1
    if (input.down) vy += 1
    const len = Math.sqrt(vx * vx + vy * vy)
    if (len > 0) {
      vx = (vx / len) * speed
      vy = (vy / len) * speed
    }
    this.player.velocity.x = vx
    this.player.velocity.y = vy

    this.player.shootCooldown -= dt
    if (input.shoot && this.player.shootCooldown <= 0) {
      this.player.shootCooldown = SHOOT_COOLDOWN
      this.spawnPlayerBullet()
      this.onPlaySound('pew')
    }
  }

  private spawnPlayerBullet() {
    const bullet: BulletEntity = {
      id: this.idCounter.current++,
      type: 'playerBullet',
      position: { x: this.player.position.x, y: this.player.position.y - this.player.height / 2 },
      velocity: { x: 0, y: -600 },
      width: 6,
      height: 6,
      rotation: 0,
      active: true,
      damage: 1,
      color: '#FFFF00',
      radius: 3
    }
    this.entities.push(bullet)
  }

  private spawnEnemyBullet(x: number, y: number, vx: number, vy: number) {
    this.entities.push(createEnemyBullet(x, y, vx, vy, this.idCounter))
  }

  public update(dt: number, cw: number, ch: number, level: number, score: number) {
    this.spawnTimer -= dt
    this.bossTimer += dt

    if (this.spawnTimer <= 0) {
      this.spawnTimer = getSpawnInterval(score, level)
      const type = selectEnemyType(score, 0)
      const margin = 50
      const x = margin + Math.random() * (cw - margin * 2)
      this.entities.push(createEnemy(type, x, cw, this.idCounter))
    }

    if (this.bossTimer >= getBossInterval()) {
      this.bossTimer = 0
      this.entities.push(createEnemy('boss', cw / 2, cw, this.idCounter))
    }

    this.updatePlayer(dt, cw, ch)

    for (const entity of this.entities) {
      if (!entity.active) continue

      entity.position.x += entity.velocity.x * dt
      entity.position.y += entity.velocity.y * dt

      if (entity.type === 'enemy') {
        updateEnemyAI(entity as EnemyEntity, dt, cw, level, this.onEnemyBulletSpawn)
        const enemy = entity as EnemyEntity
        if (enemy.hitFlashTimer > 0) enemy.hitFlashTimer -= dt
      }

      if (entity.type === 'particle') {
        const p = entity as ParticleEntity
        p.lifetime -= dt
        if (p.lifetime <= 0) p.active = false
      }

      if (entity.position.y < -100 || entity.position.y > ch + 100 ||
          entity.position.x < -100 || entity.position.x > cw + 100) {
        entity.active = false
      }
    }

    this.entities = this.entities.filter(e => e.active)
  }

  private updatePlayer(dt: number, cw: number, ch: number) {
    this.player.position.x += this.player.velocity.x * dt
    this.player.position.y += this.player.velocity.y * dt

    const hw = this.player.width / 2
    const hh = this.player.height / 2
    this.player.position.x = Math.max(hw, Math.min(cw - hw, this.player.position.x))
    this.player.position.y = Math.max(hh, Math.min(ch - hh, this.player.position.y))

    if (this.player.invincible) {
      this.player.invincibleTimer -= dt
      if (this.player.invincibleTimer <= 0) {
        this.player.invincible = false
      }
    }
  }

  public handleCollisions(events: CollisionEvent[]): boolean {
    let hitPlayer = false

    for (const event of events) {
      const { entityA, entityB } = event

      if (entityA.type === 'playerBullet' && entityB.type === 'enemy') {
        entityA.active = false
        const enemy = entityB as EnemyEntity
        enemy.hp -= 1
        enemy.hitFlashTimer = HIT_FLASH_TIME

        if (enemy.hp <= 0) {
          this.onPlaySound('explosion')
          this.spawnExplosion(enemy.position.x, enemy.position.y, enemy.enemyType)
          let points = 0
          switch (enemy.enemyType) {
            case 'normal': points = 10; break
            case 'elite': points = 30; break
            case 'boss': points = 100; break
          }
          this.score += points
          this.onScoreChange(this.score)
          enemy.active = false
        }
      }

      if (entityA.type === 'player') {
        if (entityB.type === 'enemy') {
          (entityB as EnemyEntity).hp = 0
          entityB.active = false
          this.spawnExplosion(entityB.position.x, entityB.position.y, (entityB as EnemyEntity).enemyType)
          this.onPlaySound('explosion')
        }
        if (entityB.type === 'enemyBullet') {
          entityB.active = false
        }
        hitPlayer = true
      }
    }

    if (hitPlayer && !this.player.invincible) {
      this.lives -= 1
      this.onLivesChange(this.lives)
      this.player.invincible = true
      this.player.invincibleTimer = INVINCIBLE_TIME
      if (this.lives <= 0) return true
    }

    return false
  }

  private spawnExplosion(x: number, y: number, enemyType: EnemyType) {
    const count = 6
    const color = enemyType === 'normal' ? '#FF4444' : enemyType === 'elite' ? '#4444FF' : '#9932CC'
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
      const speed = 80 + Math.random() * 120
      const particle: ParticleEntity = {
        id: this.idCounter.current++,
        type: 'particle',
        position: { x, y },
        velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        width: 0,
        height: 0,
        rotation: 0,
        active: true,
        color,
        lifetime: PARTICLE_LIFETIME,
        maxLifetime: PARTICLE_LIFETIME,
        size: 4 + Math.random() * 4
      }
      this.entities.push(particle)
    }
  }

  public getScore(): number { return this.score }
  public getLives(): number { return this.lives }
}
