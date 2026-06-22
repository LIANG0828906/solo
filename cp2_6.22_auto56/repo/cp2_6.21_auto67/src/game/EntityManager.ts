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

export const CANVAS_WIDTH = 1000
export const CANVAS_HEIGHT = 600
export const GROUND_Y = 500
export const SEGMENT_WIDTH = 1200

const JUMP_HEIGHT = 100
const JUMP_DURATION = 600
const GRAVITY = (2 * JUMP_HEIGHT) / Math.pow(JUMP_DURATION / 1000 * 60, 2)
const INITIAL_JUMP_VELOCITY = -Math.sqrt(2 * GRAVITY * JUMP_HEIGHT)

const DOUBLE_JUMP_HEIGHT = 60
const DOUBLE_JUMP_VELOCITY = -Math.sqrt(2 * GRAVITY * DOUBLE_JUMP_HEIGHT)

export type PixelColor = string | null
export type SpriteFrame = PixelColor[][]

const SPRITE_SCALE = 2
const PLAYER_WIDTH_PX = 16
const PLAYER_HEIGHT_PX = 24

const TRANSPARENT: PixelColor = null

function createEmptySprite(width: number, height: number): SpriteFrame {
  const sprite: SpriteFrame = []
  for (let y = 0; y < height; y++) {
    sprite.push(new Array(width).fill(TRANSPARENT))
  }
  return sprite
}

function drawPixel(sprite: SpriteFrame, x: number, y: number, color: string): void {
  if (y >= 0 && y < sprite.length && x >= 0 && x < sprite[0].length) {
    sprite[y][x] = color
  }
}

function drawRect(sprite: SpriteFrame, x: number, y: number, w: number, h: number, color: string): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      drawPixel(sprite, x + dx, y + dy, color)
    }
  }
}

function createPlayerFrame(frameIndex: number): SpriteFrame {
  const sprite = createEmptySprite(PLAYER_WIDTH_PX, PLAYER_HEIGHT_PX)

  const hairColor = '#00f0ff'
  const skinColor = '#ffcc99'
  const shirtColor = '#ff00aa'
  const pantsColor = '#333366'
  const shoeColor = '#1a1a2e'
  const skateboardColor = '#000000'
  const skateboardWheel = '#00f0ff'
  const eyeColor = '#000000'

  drawRect(sprite, 4, 0, 8, 4, hairColor)
  drawRect(sprite, 3, 1, 10, 2, hairColor)

  drawRect(sprite, 4, 4, 8, 6, skinColor)
  drawPixel(sprite, 6, 6, eyeColor)
  drawPixel(sprite, 9, 6, eyeColor)
  drawPixel(sprite, 7, 8, '#ff9999')

  drawRect(sprite, 3, 10, 10, 6, shirtColor)
  drawPixel(sprite, 7, 12, '#ffffff')
  drawPixel(sprite, 8, 12, '#ffffff')

  const armOffsets = [0, 1, 0, -1]
  const armY = 11 + armOffsets[frameIndex % 4]
  drawRect(sprite, 1, armY, 2, 5, shirtColor)
  drawRect(sprite, 13, 11 - armOffsets[frameIndex % 4], 2, 5, shirtColor)
  drawRect(sprite, 1, armY + 5, 2, 2, skinColor)
  drawRect(sprite, 13, 13 - armOffsets[frameIndex % 4], 2, 2, skinColor)

  const legOffsets = [0, 2, 0, -2]
  const leftLegY = 16 + (frameIndex % 2 === 0 ? legOffsets[frameIndex] : -legOffsets[frameIndex])
  const rightLegY = 16 + (frameIndex % 2 === 0 ? -legOffsets[frameIndex] : legOffsets[frameIndex])

  drawRect(sprite, 5, 16, 2, 5 + Math.max(0, leftLegY - 16), pantsColor)
  drawRect(sprite, 9, 16, 2, 5 + Math.max(0, rightLegY - 16), pantsColor)

  const leftShoeY = 21 + Math.max(0, leftLegY - 16)
  const rightShoeY = 21 + Math.max(0, rightLegY - 16)
  drawRect(sprite, 4, leftShoeY, 4, 2, shoeColor)
  drawRect(sprite, 8, rightShoeY, 4, 2, shoeColor)

  const boardY = Math.max(leftShoeY, rightShoeY) + 2
  if (boardY < PLAYER_HEIGHT_PX - 2) {
    drawRect(sprite, 2, boardY, 12, 2, skateboardColor)
    drawPixel(sprite, 3, boardY + 2, skateboardWheel)
    drawPixel(sprite, 11, boardY + 2, skateboardWheel)
  }

  return sprite
}

export const PLAYER_SPRITES: SpriteFrame[] = [
  createPlayerFrame(0),
  createPlayerFrame(1),
  createPlayerFrame(2),
  createPlayerFrame(3)
]

export { SPRITE_SCALE, PLAYER_WIDTH_PX, PLAYER_HEIGHT_PX, GRAVITY, INITIAL_JUMP_VELOCITY, DOUBLE_JUMP_VELOCITY }

interface BuildingStyle {
  name: string
  height: number
  wallColor: string
  roofColor: string
  windowColor: string
  hasNeonSign: boolean
  neonColor: string
  windowPattern: 'grid' | 'random' | 'rows'
}

const BUILDING_STYLES: BuildingStyle[] = [
  {
    name: 'classic',
    height: 80,
    wallColor: '#2a1a4a',
    roofColor: '#3a2a6a',
    windowColor: 'rgba(0, 240, 255, 0.5)',
    hasNeonSign: true,
    neonColor: '#00f0ff',
    windowPattern: 'grid'
  },
  {
    name: 'industrial',
    height: 100,
    wallColor: '#3a2a3a',
    roofColor: '#5a4a5a',
    windowColor: 'rgba(255, 200, 100, 0.4)',
    hasNeonSign: false,
    neonColor: '#ffaa00',
    windowPattern: 'rows'
  },
  {
    name: 'tower',
    height: 130,
    wallColor: '#1a0a3a',
    roofColor: '#2a1a5a',
    windowColor: 'rgba(0, 255, 200, 0.5)',
    hasNeonSign: true,
    neonColor: '#00ffcc',
    windowPattern: 'random'
  },
  {
    name: 'lowrise',
    height: 60,
    wallColor: '#4a3a5a',
    roofColor: '#6a5a7a',
    windowColor: 'rgba(255, 100, 200, 0.4)',
    hasNeonSign: true,
    neonColor: '#ff66cc',
    windowPattern: 'grid'
  },
  {
    name: 'skyscraper',
    height: 150,
    wallColor: '#1a0a2a',
    roofColor: '#2a1a4a',
    windowColor: 'rgba(100, 200, 255, 0.6)',
    hasNeonSign: true,
    neonColor: '#66ccff',
    windowPattern: 'grid'
  }
]

export class EntityManager {
  private entities: Entity[] = []
  private nextId = 0
  private player!: Entity
  private callbacks: CollisionCallback
  private currentSegmentEnd = 0
  private segmentsGenerated = 0
  private obstacleDensity = 4

  private backgroundSprites: Entity[] = []
  private useReducedQuality = false
  private speedBoostCooldown = 0

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
    this.speedBoostCooldown = 0
    this.createPlayer()
    this.generateInitialSegments()
  }

  setReducedQuality(reduced: boolean): void {
    this.useReducedQuality = reduced
  }

  private createPlayer(): void {
    const width = PLAYER_WIDTH_PX * SPRITE_SCALE
    const height = PLAYER_HEIGHT_PX * SPRITE_SCALE

    this.player = {
      id: this.nextId++,
      type: 'player',
      x: 150,
      y: GROUND_Y - height,
      width,
      height,
      velocityX: 0,
      velocityY: 0,
      collisionBox: { x: 4, y: 2, width: width - 8, height: height - 4 },
      active: true,
      data: {
        jumpCount: 0,
        maxJumps: 2,
        isOnGround: true,
        animFrame: 0,
        animTimer: 0,
        jumpVelocity: INITIAL_JUMP_VELOCITY,
        doubleJumpVelocity: DOUBLE_JUMP_VELOCITY
      }
    }
    this.entities.push(this.player)
  }

  generateInitialSegments(): void {
    for (let i = 0; i < 3; i++) {
      this.generateSegment(i === 0)
    }
  }

  private generateSegment(isFirstSegment: boolean = false): void {
    const segmentStart = this.currentSegmentEnd
    const segmentEnd = segmentStart + SEGMENT_WIDTH
    this.currentSegmentEnd = segmentEnd
    this.segmentsGenerated++

    const styleIndex = Math.floor(Math.random() * BUILDING_STYLES.length)
    const buildingStyle = BUILDING_STYLES[styleIndex]

    const buildingTop = GROUND_Y - buildingStyle.height
    this.createBuilding(segmentStart, buildingTop, SEGMENT_WIDTH, buildingStyle)

    this.createStreetDecorations(segmentStart, segmentEnd)

    this.speedBoostCooldown--
    if (!isFirstSegment && this.speedBoostCooldown <= 0 && this.segmentsGenerated > 1 && Math.random() > 0.6) {
      const boostX = segmentStart + 200 + Math.random() * 600
      this.createSpeedBoost(boostX, buildingTop - 8)
      this.speedBoostCooldown = 2
    }

    const hasGap = !isFirstSegment && this.segmentsGenerated > 1 && Math.random() > 0.65
    let gapStart = 0
    if (hasGap) {
      gapStart = segmentStart + 400 + Math.random() * 300
      this.createGap(gapStart, buildingTop)
    }

    const obstacleCount = isFirstSegment ? 0 : Math.min(Math.floor(this.obstacleDensity), 8)
    for (let i = 0; i < obstacleCount; i++) {
      const obstacleX = segmentStart + 150 + (i + 0.5) * (SEGMENT_WIDTH - 300) / obstacleCount
      if (hasGap && Math.abs(obstacleX - gapStart) < 80) continue

      const obstacleType = Math.random()
      if (obstacleType < 0.35) {
        this.createWindowObstacle(obstacleX, buildingTop)
      } else if (obstacleType < 0.65) {
        this.createACObstacle(obstacleX, buildingTop)
      }
    }

    const coinCount = isFirstSegment ? 3 : 4 + Math.floor(Math.random() * 4)
    for (let i = 0; i < coinCount; i++) {
      const coinX = segmentStart + 100 + (i + 0.5) * (SEGMENT_WIDTH - 200) / coinCount
      const coinY = buildingTop - 70 - Math.random() * 120
      this.createCoin(coinX, coinY)
    }

    if (!isFirstSegment && Math.random() > 0.5) {
      const platformX = segmentStart + 200 + Math.random() * 600
      const platformY = buildingTop - 120 - Math.random() * 120
      this.createPlatform(platformX, platformY)
    }

    this.generateBackground(segmentStart)
  }

  private createBuilding(x: number, y: number, width: number, style: BuildingStyle): void {
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
      data: {
        wallColor: style.wallColor,
        roofColor: style.roofColor,
        windowColor: style.windowColor,
        hasNeonSign: style.hasNeonSign,
        neonColor: style.neonColor,
        windowPattern: style.windowPattern,
        styleName: style.name
      }
    })
  }

  private createStreetDecorations(start: number, end: number): void {
    for (let x = start + 80; x < end; x += 180 + Math.random() * 120) {
      const decorType = Math.random()
      if (decorType < 0.4) {
        this.entities.push({
          id: this.nextId++,
          type: 'street_decor',
          x,
          y: GROUND_Y - 70,
          width: 10,
          height: 70,
          velocityX: 0,
          velocityY: 0,
          collisionBox: { x: 0, y: 0, width: 0, height: 0 },
          active: true,
          data: { decorType: 'lamp', lampColor: Math.random() > 0.5 ? '#00f0ff' : '#ff00aa' }
        })
      } else if (decorType < 0.7) {
        this.entities.push({
          id: this.nextId++,
          type: 'street_decor',
          x,
          y: GROUND_Y - 35,
          width: 24,
          height: 35,
          velocityX: 0,
          velocityY: 0,
          collisionBox: { x: 0, y: 0, width: 0, height: 0 },
          active: true,
          data: { decorType: 'trash' }
        })
      } else {
        this.entities.push({
          id: this.nextId++,
          type: 'street_decor',
          x,
          y: GROUND_Y - 50,
          width: 15,
          height: 50,
          velocityX: 0,
          velocityY: 0,
          collisionBox: { x: 0, y: 0, width: 0, height: 0 },
          active: true,
          data: { decorType: 'sign', signColor: '#ff00aa' }
        })
      }
    }
  }

  private createWindowObstacle(x: number, buildingTop: number): void {
    this.entities.push({
      id: this.nextId++,
      type: 'obstacle_window',
      x,
      y: buildingTop + 15,
      width: 32,
      height: 40,
      velocityX: 0,
      velocityY: 0,
      collisionBox: { x: 3, y: 3, width: 26, height: 34 },
      active: true,
      data: { cleared: false }
    })
  }

  private createACObstacle(x: number, groundY: number): void {
    this.entities.push({
      id: this.nextId++,
      type: 'obstacle_ac',
      x,
      y: groundY - 38,
      width: 44,
      height: 38,
      velocityX: 0,
      velocityY: 0,
      collisionBox: { x: 3, y: 3, width: 38, height: 32 },
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
      height: 200,
      velocityX: 0,
      velocityY: 0,
      collisionBox: { x: 0, y: 5, width: 120, height: 195 },
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
      width: 22,
      height: 22,
      velocityX: 0,
      velocityY: 0,
      collisionBox: { x: 3, y: 3, width: 16, height: 16 },
      active: true,
      data: { rotation: Math.random() * Math.PI * 2, collected: false, bobOffset: Math.random() * Math.PI * 2 }
    })
  }

  private createPlatform(x: number, y: number): void {
    this.entities.push({
      id: this.nextId++,
      type: 'platform',
      x,
      y,
      width: 130,
      height: 18,
      velocityX: 0,
      velocityY: 0,
      collisionBox: { x: 0, y: 0, width: 130, height: 18 },
      active: true
    })

    if (Math.random() > 0.4) {
      this.createCoin(x + 55, y - 35)
    }
  }

  private createSpeedBoost(x: number, y: number): void {
    this.entities.push({
      id: this.nextId++,
      type: 'speed_boost',
      x,
      y,
      width: 90,
      height: 10,
      velocityX: 0,
      velocityY: 0,
      collisionBox: { x: 5, y: 0, width: 80, height: 10 },
      active: true,
      data: { used: false }
    })
  }

  private generateBackground(segmentStart: number): void {
    const spriteCount = this.useReducedQuality ? 10 : 20
    for (let i = 0; i < Math.floor(spriteCount / 2); i++) {
      const parallax = 0.15 + Math.random() * 0.25
      const buildingWidth = 50 + Math.random() * 100
      const buildingHeight = 80 + Math.random() * 180
      const buildingX = segmentStart + Math.random() * SEGMENT_WIDTH
      const buildingY = GROUND_Y - buildingHeight

      this.backgroundSprites.push({
        id: this.nextId++,
        type: 'background',
        x: buildingX,
        y: buildingY,
        width: buildingWidth,
        height: buildingHeight,
        velocityX: 0,
        velocityY: 0,
        collisionBox: { x: 0, y: 0, width: 0, height: 0 },
        active: true,
        data: {
          parallax,
          color: `rgba(${25 + Math.random() * 25}, ${10 + Math.random() * 20}, ${50 + Math.random() * 30}, 0.7)`,
          windowColor: `rgba(${Math.random() * 100 + 100}, ${Math.random() * 100 + 150}, 255, 0.4)`,
          windows: Math.floor(Math.random() * 8) + 4
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

      if (entity.x + entity.width < -150) {
        entity.active = false
      }
    }

    for (const bg of this.backgroundSprites) {
      const parallax = (bg.data?.parallax as number) || 0.3
      bg.x -= moveAmount * parallax

      if (bg.x + bg.width < -150) {
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
    const playerData = this.player.data as Record<string, unknown>
    let isOnGround = playerData.isOnGround as boolean

    this.player.velocityY += GRAVITY * (deltaTime / 16.67)

    const newY = this.player.y + this.player.velocityY * (deltaTime / 16.67)

    let landed = false
    for (const entity of this.entities) {
      if (!entity.active) continue
      if (entity.type !== 'building' && entity.type !== 'platform') continue

      const playerBox = this.getAbsoluteCollisionBox(this.player)
      const entityBox = this.getAbsoluteCollisionBox(entity)

      const playerBottom = playerBox.y + playerBox.height
      const newBottom = newY + this.player.collisionBox.y + this.player.collisionBox.height

      if (
        this.player.velocityY >= 0 &&
        playerBox.x + playerBox.width > entityBox.x + 5 &&
        playerBox.x < entityBox.x + entityBox.width - 5 &&
        playerBottom <= entityBox.y + 15 &&
        newBottom >= entityBox.y
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

    if (this.player.y > CANVAS_HEIGHT + 50) {
      this.callbacks.onGameOver()
    }

    ;(this.player.data as Record<string, unknown>).isOnGround = isOnGround
    if (isOnGround) {
      ;(this.player.data as Record<string, unknown>).jumpCount = 0
    }

    const animTimer = ((playerData.animTimer as number) || 0) + deltaTime
    const animSpeed = isOnGround ? 120 : 200
    if (animTimer > animSpeed) {
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
      entity.x + entity.width < this.player.x - 10
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

    if (jumpCount === 0) {
      this.player.velocityY = INITIAL_JUMP_VELOCITY
      ;(this.player.data as Record<string, unknown>).jumpCount = 1
      ;(this.player.data as Record<string, unknown>).isOnGround = false
      return true
    }
    return false
  }

  doubleJump(): boolean {
    const playerData = this.player.data as Record<string, unknown>
    const jumpCount = playerData.jumpCount as number

    if (jumpCount === 1) {
      this.player.velocityY = DOUBLE_JUMP_VELOCITY
      ;(this.player.data as Record<string, unknown>).jumpCount = 2
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
