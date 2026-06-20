import { eventBus, EVENTS } from '../core/EventBus'

export interface PlayerState {
  x: number
  y: number
  z: number
  velocityX: number
  velocityY: number
  velocityZ: number
  pitch: number
  roll: number
  baseSpeed: number
  currentSpeed: number
}

export interface ObstacleData {
  id: string
  x: number
  y: number
  z: number
  width: number
  height: number
  depth: number
}

export interface ShardData {
  id: string
  x: number
  y: number
  z: number
  collected: boolean
}

export interface CanyonWallData {
  z: number
  leftX: number
  rightX: number
  width: number
}

export class PhysicsModule {
  private player: PlayerState
  private targetX: number = 0
  private targetY: number = 0
  private responseDelay: number = 0.05
  private maxHorizontalOffset: number = 200
  private gravity: number = 2
  private isRunning: boolean = false
  private isPaused: boolean = false

  private obstacles: ObstacleData[] = []
  private shards: ShardData[] = []
  private canyonWalls: CanyonWallData[] = []

  private collisionCooldown: number = 0
  private collisionCooldownTime: number = 1.0
  private lastCollisionTime: number = 0

  private pitchSpeedMultiplier: number = 1.0
  private diveSpeedBoost: number = 1.3
  private climbSpeedReduction: number = 0.8

  private playerRadius: number = 1.5
  private shardPickupRadius: number = 1.5

  constructor() {
    this.player = {
      x: 0,
      y: 0,
      z: 0,
      velocityX: 0,
      velocityY: 0,
      velocityZ: 5,
      pitch: 0,
      roll: 0,
      baseSpeed: 5,
      currentSpeed: 5,
    }
    this.bindEvents()
  }

  private bindEvents(): void {
    eventBus.on(EVENTS.INPUT_MOUSE_MOVE, this.handleMouseMove.bind(this))
    eventBus.on(EVENTS.GAME_START, this.handleGameStart.bind(this))
    eventBus.on(EVENTS.GAME_RESTART, this.handleRestart.bind(this))
    eventBus.on(EVENTS.GAME_PAUSE, this.handlePause.bind(this))
    eventBus.on(EVENTS.RENDER_CANYON_CHUNK, this.handleCanyonChunk.bind(this))
    eventBus.on(EVENTS.RENDER_REMOVE_CHUNK, this.handleRemoveChunk.bind(this))
  }

  private handleMouseMove(data: { x: number; y: number }): void {
    this.targetX = data.x * this.maxHorizontalOffset
    this.targetY = data.y * 100
  }

  private handleGameStart(data: { speed: number }): void {
    this.player.baseSpeed = data.speed
    this.player.currentSpeed = data.speed
    this.player.velocityZ = data.speed
    this.isRunning = true
    this.isPaused = false
  }

  private handleRestart(): void {
    this.player = {
      x: 0,
      y: 0,
      z: 0,
      velocityX: 0,
      velocityY: 0,
      velocityZ: 5,
      pitch: 0,
      roll: 0,
      baseSpeed: 5,
      currentSpeed: 5,
    }
    this.targetX = 0
    this.targetY = 0
    this.obstacles = []
    this.shards = []
    this.canyonWalls = []
    this.collisionCooldown = 0
    this.lastCollisionTime = 0
    this.pitchSpeedMultiplier = 1.0
    this.isRunning = true
    this.isPaused = false
  }

  private handlePause(data: { paused: boolean }): void {
    this.isPaused = data.paused
  }

  private handleCanyonChunk(data: {
    z: number
    width: number
    obstacles: ObstacleData[]
    shards: ShardData[]
  }): void {
    this.obstacles.push(...data.obstacles)
    this.shards.push(...data.shards)
    this.canyonWalls.push({
      z: data.z,
      leftX: -data.width / 2,
      rightX: data.width / 2,
      width: data.width,
    })
  }

  private handleRemoveChunk(data: { z: number }): void {
    this.obstacles = this.obstacles.filter((o) => o.z > data.z)
    this.shards = this.shards.filter((s) => s.z > data.z)
    this.canyonWalls = this.canyonWalls.filter((w) => w.z > data.z)
  }

  update(deltaTime: number, currentTime: number): void {
    if (!this.isRunning || this.isPaused) return

    if (this.collisionCooldown > 0) {
      this.collisionCooldown -= deltaTime
    }

    this.updatePlayerPosition(deltaTime)
    this.checkWallCollisions()
    this.checkObstacleCollisions()
    this.checkShardPickups()

    eventBus.emit(EVENTS.PLAYER_POSITION, {
      x: this.player.x,
      y: this.player.y,
      z: this.player.z,
      pitch: this.player.pitch,
      roll: this.player.roll,
      speed: this.player.currentSpeed,
    })
  }

  private updatePlayerPosition(deltaTime: number): void {
    const dx = this.targetX - this.player.x
    const dy = this.targetY - this.player.y

    const smoothFactor = deltaTime / this.responseDelay
    const clampedFactor = Math.min(smoothFactor, 1)

    this.player.velocityX = (dx / this.responseDelay) * clampedFactor
    this.player.velocityY = (dy / this.responseDelay) * clampedFactor

    this.player.x += this.player.velocityX * deltaTime
    this.player.y += this.player.velocityY * deltaTime

    this.player.x = Math.max(
      -this.maxHorizontalOffset,
      Math.min(this.maxHorizontalOffset, this.player.x)
    )

    const pitchNormalized = this.targetY / 100
    this.player.pitch = -pitchNormalized * 0.3

    if (pitchNormalized > 0.1) {
      this.pitchSpeedMultiplier = this.diveSpeedBoost
    } else if (pitchNormalized < -0.1) {
      this.pitchSpeedMultiplier = this.climbSpeedReduction
    } else {
      this.pitchSpeedMultiplier = 1.0
    }

    this.player.currentSpeed = this.player.baseSpeed * this.pitchSpeedMultiplier
    this.player.velocityZ = this.player.currentSpeed

    this.player.z += this.player.velocityZ * deltaTime

    const rollTarget = -this.player.velocityX * 0.02
    this.player.roll += (rollTarget - this.player.roll) * clampedFactor
    this.player.roll = Math.max(-0.26, Math.min(0.26, this.player.roll))
  }

  private checkWallCollisions(): void {
    if (this.collisionCooldown > 0) return

    const playerX = this.player.x
    const playerZ = this.player.z

    let nearestWall: CanyonWallData | null = null
    let minDist = Infinity

    for (const wall of this.canyonWalls) {
      const dist = Math.abs(wall.z - playerZ)
      if (dist < minDist && dist < 20) {
        minDist = dist
        nearestWall = wall
      }
    }

    if (nearestWall) {
      const playerRadius = this.playerRadius
      if (
        playerX - playerRadius < nearestWall.leftX ||
        playerX + playerRadius > nearestWall.rightX
      ) {
        this.triggerCollision('wall')
      }
    }
  }

  private checkObstacleCollisions(): void {
    if (this.collisionCooldown > 0) return

    const px = this.player.x
    const py = this.player.y
    const pz = this.player.z
    const pr = this.playerRadius

    for (const obstacle of this.obstacles) {
      if (Math.abs(obstacle.z - pz) > 20) continue

      const closestX = Math.max(
        obstacle.x - obstacle.width / 2,
        Math.min(px, obstacle.x + obstacle.width / 2)
      )
      const closestY = Math.max(
        obstacle.y - obstacle.height / 2,
        Math.min(py, obstacle.y + obstacle.height / 2)
      )
      const closestZ = Math.max(
        obstacle.z - obstacle.depth / 2,
        Math.min(pz, obstacle.z + obstacle.depth / 2)
      )

      const dx = px - closestX
      const dy = py - closestY
      const dz = pz - closestZ
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (distance < pr) {
        this.triggerCollision('obstacle')
        break
      }
    }
  }

  private checkShardPickups(): void {
    const px = this.player.x
    const py = this.player.y
    const pz = this.player.z
    const pickupRadius = this.shardPickupRadius

    for (const shard of this.shards) {
      if (shard.collected) continue
      if (Math.abs(shard.z - pz) > 20) continue

      const dx = px - shard.x
      const dy = py - shard.y
      const dz = pz - shard.z
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (distance < pickupRadius) {
        shard.collected = true
        eventBus.emit(EVENTS.SHARD_COLLECTED, {
          id: shard.id,
          position: { x: shard.x, y: shard.y, z: shard.z },
        })
      }
    }
  }

  private triggerCollision(type: 'wall' | 'obstacle'): void {
    if (this.collisionCooldown > 0) return

    this.collisionCooldown = this.collisionCooldownTime

    eventBus.emit(EVENTS.PLAYER_COLLISION, {
      type,
      position: {
        x: this.player.x,
        y: this.player.y,
        z: this.player.z,
      },
    })
  }

  setBaseSpeed(speed: number): void {
    this.player.baseSpeed = speed
  }

  getPlayerState(): PlayerState {
    return { ...this.player }
  }

  getObstacles(): ObstacleData[] {
    return [...this.obstacles]
  }

  getShards(): ShardData[] {
    return [...this.shards]
  }
}
