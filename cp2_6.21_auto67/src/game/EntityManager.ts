export type EntityType =
  | 'player'
  | 'obstacle_window'
  | 'obstacle_ac'
  | 'obstacle_gap'
  | 'coin'
  | 'platform'
  | 'building'
  | 'street_decor'
  | 'speed_boost'
  | 'background'

export interface CollisionBox {
  x: number
  y: number
  width: number
  height: number
}

export interface Entity {
  id: number
  type: EntityType
  x: number
  y: number
  width: number
  height: number
  velocityX: number
  velocityY: number
  collisionBox: CollisionBox
  active: boolean
  data?: Record<string, unknown>
}

export interface CollisionCallback {
  onCoinCollect: (entity: Entity) => void
  onObstacleHit: (entity: Entity) => void
  onSpeedBoost: (entity: Entity) => void
  onGameOver: () => void
  onObstacleCleared: () => void
}

const CANVAS_HEIGHT = 600
const GROUND_Y = 500
const SEGMENT_WIDTH = 1200

const BUILDING_STYLES = [
  { color: '#2a1a4a', height: 80 },
  { color: '#3a2a5a', height: 100 },
  { color: '#1a0a3a', height: 120 },
  { color: '#4a3a6a', height: 90 },
  { color: '#2a1a5a', height: 110 }
]

export class EntityManager {
  private entities: Entity[] = []
  private nextId = 0
  private player!: Entity
  private callbacks: CollisionCallback
  private currentSegmentEnd = 0
  private segmentsGenerated = 0
  private obstacleDensity = 4
  private lastSpeedBoostSegment = -1
  private backgroundSprites: Entity[] = []
  private useReducedQuality = false

  constructor(callbacks: CollisionCallback) {
    this.callbacks = callbacks
    this.createPlayer()
  }

  reset(): void {
    this.entities = []
    this.backgroundSprites = []
    this.nextId = 0
    this.currentSegmentEnd = 0
    this.segmentsGenerated = 0
    this.obstacleDensity = 4
    this.lastSpeedBoostSegment = -1
    this.createPlayer()
    this.generateInitialSegments()
  }

  setReducedQuality(reduced: boolean): void {
    this.useReducedQuality = reduced
  }

  private createPlayer(): void {
    this.player = {
      id: this.nextId++,
      type: 'player',
      x: 150,
      y: GROUND_Y - 48,
      width: 32,
      height: 48,
      velocityX: 0,
      velocityY: 0,
      collisionBox: { x: 8, y: 4, width: 16, height: 40 },
      active: true,
      data: {
        jumpCount: 0,
        maxJumps: 2,
        isOnGround: true,
        animFrame: 0,
        animTimer: 0
      }
    }
    this.entities.push(this.player)
  }

  generateInitialSegments(): void {
    for (let i = 0; i < 3; i++) {
      this.generateSegment()
    }
  }

  private generateSegment(): void {
    const segmentStart = this.currentSegmentEnd
    const segmentEnd = segmentStart + SEGMENT_WIDTH
    this.currentSegmentEnd = segmentEnd
    this.segmentsGenerated++

    const styleIndex = Math.floor(Math.random() * BUILDING_STYLES.length)
    const buildingStyle = BUILDING_STYLES[styleIndex]

    const buildingTop = GROUND_Y - buildingStyle.height
    this.createBuilding(segmentStart, buildingTop, SEGMENT_WIDTH, buildingStyle)

    this.createStreetDecorations(segmentStart, segmentEnd)

    const shouldAddSpeedBoost =
      this.segmentsGenerated > 1 &&
      this.segmentsGenerated % 2 === 0 &&
      this.segmentsGenerated !== this.lastSpeedBoostSegment + 1

    if (shouldAddSpeedBoost && Math.random() > 0.5) {
      const boostX = segmentStart + 200 + Math.random() * 600
      this.createSpeedBoost(boostX, GROUND_Y - 8)
      this.lastSpeedBoostSegment = this.segmentsGenerated
    }

    const hasGap = Math.random() > 0.7
    if (hasGap && this.segmentsGenerated > 1) {
      const gapStart = segmentStart + 400 + Math.random() * 400
      this.createGap(gapStart, GROUND_Y)
    }

    const obstacleCount = Math.min(
      Math.floor(this.obstacleDensity),
      8
    )
    for (let i = 0; i < obstacleCount; i++) {
      const obstacleX = segmentStart + 150 + (i * SEGMENT_WIDTH) / (obstacleCount + 1)
      if (hasGap && Math.abs(obstacleX - (segmentStart + 460)) < 100) continue

      const obstacleType = Math.random()
      if (obstacleType < 0.4) {
        this.createWindowObstacle(obstacleX, buildingTop)
      } else if (obstacleType < 0.7) {
        this.createACObstacle(obstacleX, GROUND_Y)
      }
    }

    const coinCount = 3 + Math.floor(Math.random() * 4)
    for (let i = 0; i < coinCount; i++) {
      const coinX = segmentStart + 100 + (i + 0.5) * (SEGMENT_WIDTH - 200) / coinCount
      const coinY = GROUND_Y - 80 - Math.random() * 100
      this.createCoin(coinX, coinY)
    }

    if (Math.random() > 0.6) {
      const platformX = segmentStart + 300 + Math.random() * 500
      const platformY = GROUND_Y - 150 - Math.random() * 100
      this.createPlatform(platformX, platformY)
    }

    this.generateBackground(segmentStart)
  }

  private createBuilding(x: number, y: number, width: number, style: { color: string; height: number }): void {
    this.entities.push({
      id: this.nextId++,
      type: 'building',
      x,
      y,
      width,
      height: style.height,
      velocityX: 0,
      velocityY: 0,
      collisionBox: { x: 0, y: 0, width, height: style.height },
      active: true,
      data: { color: style.color }
    })
  }

  private createStreetDecorations(start: number, end: number): void {
    for (let x = start + 100; x < end; x += 250 + Math.random() * 100) {
      if (Math.random() > 0.5) {
        this.entities.push({
          id: this.nextId++,
          type: 'street_decor',
          x,
          y: GROUND_Y - 60,
          width: 8,
          height: 60,
          velocityX: 0,
          velocityY: 0,
          collisionBox: { x: 0, y: 0, width: 0, height: 0 },
          active: true,
          data: { decorType: 'lamp' }
        })
      } else {
        this.entities.push({
          id: this.nextId++,
          type: 'street_decor',
          x,
          y: GROUND_Y - 30,
          width: 20,
          height: 30,
          velocityX: 0,
          velocityY: 0,
          collisionBox: { x: 0, y: 0, width: 0, height: 0 },
          active: true,
          data: { decorType: 'trash' }
        })
      }
    }
  }

  private createWindowObstacle(x: number, buildingTop: number): void {
    this.entities.push({
      id: this.nextId++,
      type: 'obstacle_window',
      x,
      y: buildingTop + 20,
      width: 30,
      height: 40,
      velocityX: 0,
      velocityY: 0,
      collisionBox: { x: 2, y: 2, width: 26, height: 36 },
      active: true,
      data: { cleared: false }
    })
  }

  private createACObstacle(x: number, groundY: number): void {
    this.entities.push({
      id: this.nextId++,
      type: 'obstacle_ac',
      x,
      y: groundY - 35,
      width: 40,
      height: 35,
      velocityX: 0,
      velocityY: 0,
      collisionBox: { x: 2, y: 2, width: 36, height: 31 },
      active: true,
      data: { cleared: false, hit: false }
    })
  }

  private createGap(x: number, groundY: number): void {
    this.entities.push({
      id: this.nextId++,
      type: 'obstacle_gap',
      x,
      y: groundY,
      width: 120,
      height: 100,
      velocityX: 0,
      velocityY: 0,
      collisionBox: { x: 0, y: 10, width: 120, height: 90 },
      active: true,
      data: { cleared: false }
    })
  }

  private createCoin(x: number, y: number): void {
    this.entities.push({
      id: this.nextId++,
      type: 'coin',
      x,
      y,
      width: 20,
      height: 20,
      velocityX: 0,
      velocityY: 0,
      collisionBox: { x: 2, y: 2, width: 16, height: 16 },
      active: true,
      data: { rotation: Math.random() * Math.PI * 2, collected: false }
    })
  }

  private createPlatform(x: number, y: number): void {
    this.entities.push({
      id: this.nextId++,
      type: 'platform',
      x,
      y,
      width: 120,
      height: 15,
      velocityX: 0,
      velocityY: 0,
      collisionBox: { x: 0, y: 0, width: 120, height: 15 },
      active: true
    })

    if (Math.random() > 0.5) {
      this.createCoin(x + 50, y - 40)
    }
  }

  private createSpeedBoost(x: number, y: number): void {
    this.entities.push({
      id: this.nextId++,
      type: 'speed_boost',
      x,
      y,
      width: 80,
      height: 8,
      velocityX: 0,
      velocityY: 0,
      collisionBox: { x: 0, y: 0, width: 80, height: 8 },
      active: true,
      data: { used: false }
    })
  }

  private generateBackground(segmentStart: number): void {
    const spriteCount = this.useReducedQuality ? 10 : 20
    for (let i = 0; i < spriteCount / 3; i++) {
      this.backgroundSprites.push({
        id: this.nextId++,
        type: 'background',
        x: segmentStart + Math.random() * SEGMENT_WIDTH,
        y: 50 + Math.random() * 200,
        width: 40 + Math.random() * 80,
        height: 100 + Math.random() * 150,
        velocityX: 0,
        velocityY: 0,
        collisionBox: { x: 0, y: 0, width: 0, height: 0 },
        active: true,
        data: {
          parallax: 0.2 + Math.random() * 0.3,
          color: `rgba(${30 + Math.random() * 20}, ${10 + Math.random() * 20}, ${60 + Math.random() * 30}, 0.6)`
        }
      })
    }
  }

  getPlayer(): Entity {
    return this.player
  }

  getEntities(): Entity[] {
    return this.entities.filter(e => e.active)
  }

  getBackgroundSprites(): Entity[] {
    return this.backgroundSprites.filter(e => e.active)
  }

  update(speed: number, deltaTime: number): void {
    const moveAmount = speed

    for (const entity of this.entities) {
      if (entity.type === 'player') continue

      entity.x -= moveAmount

      if (entity.x + entity.width < -100) {
        entity.active = false
      }
    }

    for (const bg of this.backgroundSprites) {
      const parallax = bg.data?.parallax as number || 0.3
      bg.x -= moveAmount * parallax

      if (bg.x + bg.width < -100) {
        bg.active = false
      }
    }

    this.updatePlayer(deltaTime)

    if (this.player.x < 100) {
      this.player.x = 100
    }

    this.detectCollisions()
    this.checkSegmentGeneration()
  }

  private updatePlayer(deltaTime: number): void {
    const gravity = 0.8
    const playerData = this.player.data as Record<string, unknown>
    let isOnGround = playerData.isOnGround as boolean

    this.player.velocityY += gravity

    const newY = this.player.y + this.player.velocityY

    let landed = false
    for (const entity of this.entities) {
      if (!entity.active) continue
      if (entity.type !== 'building' && entity.type !== 'platform') continue

      const playerBox = this.getAbsoluteCollisionBox(this.player)
      const entityBox = this.getAbsoluteCollisionBox(entity)

      if (
        this.player.velocityY >= 0 &&
        playerBox.x + playerBox.width > entityBox.x &&
        playerBox.x < entityBox.x + entityBox.width &&
        playerBox.y + playerBox.height <= entityBox.y + 10 &&
        newY + this.player.collisionBox.y + this.player.collisionBox.height >= entityBox.y
      ) {
        this.player.y = entityBox.y - this.player.height - this.player.collisionBox.y
        this.player.velocityY = 0
        landed = true
        break
      }
    }

    if (!landed) {
      this.player.y = newY
    }

    isOnGround = landed

    if (this.player.y > CANVAS_HEIGHT + 100) {
      this.callbacks.onGameOver()
    }

    (this.player.data as Record<string, unknown>).isOnGround = isOnGround
    if (isOnGround) {
      (this.player.data as Record<string, unknown>).jumpCount = 0
    }

    const animTimer = ((playerData.animTimer as number) || 0) + deltaTime
    if (animTimer > 100) {
      const currentFrame = ((playerData.animFrame as number) || 0)
      ;(this.player.data as Record<string, unknown>).animFrame = (currentFrame + 1) % 4
      ;(this.player.data as Record<string, unknown>).animTimer = 0
    } else {
      ;(this.player.data as Record<string, unknown>).animTimer = animTimer
    }
  }

  private getAbsoluteCollisionBox(entity: Entity): CollisionBox {
    return {
      x: entity.x + entity.collisionBox.x,
      y: entity.y + entity.collisionBox.y,
      width: entity.collisionBox.width,
      height: entity.collisionBox.height
    }
  }

  private checkCollision(a: Entity, b: Entity): boolean {
    const boxA = this.getAbsoluteCollisionBox(a)
    const boxB = this.getAbsoluteCollisionBox(b)

    return (
      boxA.x < boxB.x + boxB.width &&
      boxA.x + boxA.width > boxB.x &&
      boxA.y < boxB.y + boxB.height &&
      boxA.y + boxA.height > boxB.y
    )
  }

  private detectCollisions(): void {
    for (const entity of this.entities) {
      if (!entity.active) continue
      if (entity.type === 'player' || entity.type === 'building' || entity.type === 'platform' || entity.type === 'street_decor' || entity.type === 'background') continue

      if (this.checkCollision(this.player, entity)) {
        this.handleCollision(entity)
      } else {
        this.checkObstacleCleared(entity)
      }
    }
  }

  private handleCollision(entity: Entity): void {
    switch (entity.type) {
      case 'coin':
        if (!(entity.data?.collected as boolean)) {
          ;(entity.data as Record<string, unknown>).collected = true
          entity.active = false
          this.callbacks.onCoinCollect(entity)
        }
        break

      case 'obstacle_window':
      case 'obstacle_gap':
        this.callbacks.onGameOver()
        break

      case 'obstacle_ac':
        if (!(entity.data?.hit as boolean)) {
          ;(entity.data as Record<string, unknown>).hit = true
          this.callbacks.onObstacleHit(entity)
        }
        break

      case 'speed_boost':
        if (!(entity.data?.used as boolean)) {
          ;(entity.data as Record<string, unknown>).used = true
          entity.active = false
          this.callbacks.onSpeedBoost(entity)
        }
        break
    }
  }

  private checkObstacleCleared(entity: Entity): void {
    if (
      (entity.type === 'obstacle_window' ||
       entity.type === 'obstacle_ac' ||
       entity.type === 'obstacle_gap') &&
      !(entity.data?.cleared as boolean) &&
      entity.x + entity.width < this.player.x
    ) {
      ;(entity.data as Record<string, unknown>).cleared = true
      this.callbacks.onObstacleCleared()
    }
  }

  private checkSegmentGeneration(): void {
    while (this.currentSegmentEnd - this.player.x < SEGMENT_WIDTH * 2) {
      this.generateSegment()
    }
  }

  jump(): boolean {
    const playerData = this.player.data as Record<string, unknown>
    const jumpCount = playerData.jumpCount as number
    const maxJumps = playerData.maxJumps as number

    if (jumpCount < maxJumps) {
      if (jumpCount === 0) {
        this.player.velocityY = -16
      } else {
        this.player.velocityY = -12
      }
      ;(this.player.data as Record<string, unknown>).jumpCount = jumpCount + 1
      ;(this.player.data as Record<string, unknown>).isOnGround = false
      return true
    }
    return false
  }

  doubleJump(): boolean {
    const playerData = this.player.data as Record<string, unknown>
    const jumpCount = playerData.jumpCount as number
    const maxJumps = playerData.maxJumps as number

    if (jumpCount === 1 && jumpCount < maxJumps) {
      this.player.velocityY = -12
      ;(this.player.data as Record<string, unknown>).jumpCount = jumpCount + 1
      ;(this.player.data as Record<string, unknown>).isOnGround = false
      return true
    }
    return false
  }

  increaseObstacleDensity(percent: number): void {
    this.obstacleDensity = Math.min(this.obstacleDensity * (1 + percent), 8)
  }

  getObstacleDensity(): number {
    return this.obstacleDensity
  }
}
