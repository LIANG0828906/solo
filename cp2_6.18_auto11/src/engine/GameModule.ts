import { eventBus, EVENTS } from '../core/EventBus'
import type { ObstacleData, ShardData } from './PhysicsModule'

interface GameState {
  score: number
  energy: number
  maxEnergy: number
  distance: number
  shardsCollected: number
  speed: number
  baseSpeed: number
  canyonWidth: number
  initialCanyonWidth: number
  minCanyonWidth: number
  narrowRate: number
  narrowRateMultiplier: number
  level: number
  isRunning: boolean
  isGameOver: boolean
  isPaused: boolean
  lastScoreMilestone: number
}

interface CanyonChunk {
  z: number
  width: number
  obstacles: ObstacleData[]
  shards: ShardData[]
  generated: boolean
}

export class GameModule {
  private state: GameState

  private chunks: Map<number, CanyonChunk> = new Map()
  private chunkSize: number = 100
  private visibleChunksAhead: number = 8
  private visibleChunksBehind: number = 2

  private lastGeneratedZ: number = 0
  private playerZ: number = 0

  private obstacleInterval: number = 15
  private shardMinInterval: number = 8
  private shardMaxInterval: number = 12

  private speedIncreasePerMilestone: number = 0.5
  private scoreMilestone: number = 25
  private narrowRateIncrease: number = 0.1

  private distancePerScore: number = 100
  private lastScoreDistance: number = 0

  private shardsPerBonus: number = 10
  private shardBonusScore: number = 5
  private lastShardBonusCount: number = 0

  private chunkIdCounter: number = 0

  constructor() {
    this.state = {
      score: 0,
      energy: 100,
      maxEnergy: 100,
      distance: 0,
      shardsCollected: 0,
      speed: 5,
      baseSpeed: 5,
      canyonWidth: 600,
      initialCanyonWidth: 600,
      minCanyonWidth: 200,
      narrowRate: 0.002,
      narrowRateMultiplier: 1.0,
      level: 0,
      isRunning: false,
      isGameOver: false,
      isPaused: false,
      lastScoreMilestone: 0,
    }
    this.bindEvents()
  }

  private bindEvents(): void {
    eventBus.on(EVENTS.PLAYER_POSITION, this.handlePlayerPosition.bind(this))
    eventBus.on(EVENTS.PLAYER_COLLISION, this.handleCollision.bind(this))
    eventBus.on(EVENTS.SHARD_COLLECTED, this.handleShardCollected.bind(this))
    eventBus.on(EVENTS.GAME_RESTART, this.handleRestart.bind(this))
    eventBus.on(EVENTS.GAME_PAUSE, this.handlePause.bind(this))
  }

  start(): void {
    this.state.isRunning = true
    this.state.isGameOver = false
    this.state.isPaused = false

    this.generateInitialChunks()

    eventBus.emit(EVENTS.GAME_START, {
      speed: this.state.speed,
    })

    this.emitStateUpdates()
  }

  private handleRestart(): void {
    this.state = {
      score: 0,
      energy: 100,
      maxEnergy: 100,
      distance: 0,
      shardsCollected: 0,
      speed: 5,
      baseSpeed: 5,
      canyonWidth: 600,
      initialCanyonWidth: 600,
      minCanyonWidth: 200,
      narrowRate: 0.002,
      narrowRateMultiplier: 1.0,
      level: 0,
      isRunning: true,
      isGameOver: false,
      isPaused: false,
      lastScoreMilestone: 0,
    }

    this.playerZ = 0
    this.lastGeneratedZ = 0
    this.lastScoreDistance = 0
    this.lastShardBonusCount = 0
    this.chunks.clear()
    this.chunkIdCounter = 0

    this.generateInitialChunks()

    eventBus.emit(EVENTS.GAME_START, {
      speed: this.state.speed,
    })

    this.emitStateUpdates()
  }

  private handlePause(data: { paused: boolean }): void {
    this.state.isPaused = data.paused
  }

  private handlePlayerPosition(data: {
    x: number
    y: number
    z: number
    pitch: number
    roll: number
    speed: number
  }): void {
    if (!this.state.isRunning || this.state.isGameOver || this.state.isPaused)
      return

    const prevZ = this.playerZ
    this.playerZ = data.z

    const deltaZ = this.playerZ - prevZ
    if (deltaZ > 0) {
      this.state.distance += deltaZ
      this.updateScoreByDistance()
      this.updateCanyonWidth(deltaZ)
      this.updateSpeedOverTime(deltaZ)
    }

    this.manageChunks()

    this.emitStateUpdates()
  }

  private handleCollision(data: { type: string; position: { x: number; y: number; z: number } }): void {
    if (!this.state.isRunning || this.state.isGameOver) return

    this.state.energy = Math.max(0, this.state.energy - 20)

    eventBus.emit(EVENTS.EFFECTS_SCREEN_FLASH, {
      color: '#FF4444',
      opacity: 0.3,
      duration: 0.3,
      borderOnly: true,
      borderWidth: 3,
    })

    eventBus.emit(EVENTS.EFFECTS_SHAKE, {
      intensity: 0.1,
      duration: 0.2,
    })

    if (this.state.energy <= 0) {
      this.gameOver()
    }

    this.emitStateUpdates()
  }

  private handleShardCollected(data: { id: string; position: { x: number; y: number; z: number } }): void {
    if (!this.state.isRunning || this.state.isGameOver) return

    this.state.shardsCollected++

    this.state.energy = Math.min(this.state.maxEnergy, this.state.energy + 5)

    eventBus.emit(EVENTS.EFFECTS_SHARD_PICKUP, {
      id: data.id,
      position: data.position,
    })

    eventBus.emit(EVENTS.EFFECTS_GLOW_PULSE, {
      position: data.position,
      color: '#88FF88',
      duration: 0.3,
      maxRadius: 8,
    })

    this.checkShardBonus()

    this.emitStateUpdates()
  }

  private updateScoreByDistance(): void {
    const distanceDelta = this.state.distance - this.lastScoreDistance

    if (distanceDelta >= this.distancePerScore) {
      const scoreIncrease = Math.floor(distanceDelta / this.distancePerScore)
      this.state.score += scoreIncrease
      this.lastScoreDistance += scoreIncrease * this.distancePerScore

      this.checkScoreMilestones()
    }
  }

  private checkShardBonus(): void {
    const bonusCount = Math.floor(this.state.shardsCollected / this.shardsPerBonus)
    const newBonuses = bonusCount - this.lastShardBonusCount

    if (newBonuses > 0) {
      this.state.score += newBonuses * this.shardBonusScore
      this.lastShardBonusCount = bonusCount
      this.checkScoreMilestones()
    }
  }

  private checkScoreMilestones(): void {
    const currentMilestone = Math.floor(this.state.score / this.scoreMilestone)
    const newMilestones = currentMilestone - this.state.lastScoreMilestone

    if (newMilestones > 0) {
      this.state.lastScoreMilestone = currentMilestone
      this.state.level += newMilestones

      this.state.speed += this.speedIncreasePerMilestone * newMilestones
      this.state.baseSpeed = this.state.speed

      this.state.narrowRateMultiplier *= Math.pow(1 + this.narrowRateIncrease, newMilestones)

      eventBus.emit(EVENTS.GAME_LEVEL_UP, {
        level: this.state.level,
        speed: this.state.speed,
        narrowRateMultiplier: this.state.narrowRateMultiplier,
      })

      eventBus.emit(EVENTS.EFFECTS_SCREEN_FLASH, {
        color: '#FFFFFF',
        opacity: 0.3,
        duration: 0.1,
        borderOnly: false,
      })
    }
  }

  private updateCanyonWidth(deltaZ: number): void {
    const narrowAmount = this.state.narrowRate * this.state.narrowRateMultiplier * deltaZ
    this.state.canyonWidth = Math.max(
      this.state.minCanyonWidth,
      this.state.canyonWidth - narrowAmount
    )
  }

  private updateSpeedOverTime(deltaZ: number): void {
    const speedIncreaseRate = 0.0001
    const maxSpeedMultiplier = 3.0
    const currentMultiplier = this.state.speed / this.state.baseSpeed

    if (currentMultiplier < maxSpeedMultiplier) {
      const increase = speedIncreaseRate * deltaZ
      this.state.speed = Math.min(
        this.state.baseSpeed * maxSpeedMultiplier,
        this.state.speed + increase
      )
    }
  }

  private gameOver(): void {
    this.state.isGameOver = true
    this.state.isRunning = false

    eventBus.emit(EVENTS.GAME_GAME_OVER, {
      finalScore: this.state.score,
      distance: this.state.distance,
      shardsCollected: this.state.shardsCollected,
    })
  }

  private generateInitialChunks(): void {
    for (let i = 0; i < this.visibleChunksAhead; i++) {
      const chunkZ = i * this.chunkSize
      this.generateChunk(chunkZ)
    }
  }

  private manageChunks(): void {
    const currentChunkIndex = Math.floor(this.playerZ / this.chunkSize)

    for (
      let i = currentChunkIndex - this.visibleChunksBehind;
      i <= currentChunkIndex + this.visibleChunksAhead;
      i++
    ) {
      const chunkZ = i * this.chunkSize
      if (!this.chunks.has(chunkZ) && chunkZ >= 0) {
        this.generateChunk(chunkZ)
      }
    }

    const chunksToRemove: number[] = []
    this.chunks.forEach((chunk, z) => {
      if (z < this.playerZ - this.visibleChunksBehind * this.chunkSize) {
        chunksToRemove.push(z)
      }
    })

    chunksToRemove.forEach((z) => {
      this.chunks.delete(z)
      eventBus.emit(EVENTS.RENDER_REMOVE_CHUNK, { z })
    })
  }

  private generateChunk(chunkZ: number): void {
    const width = this.getCanyonWidthAt(chunkZ)
    const obstacles = this.generateObstacles(chunkZ, width)
    const shards = this.generateShards(chunkZ, width)

    const chunk: CanyonChunk = {
      z: chunkZ,
      width,
      obstacles,
      shards,
      generated: true,
    }

    this.chunks.set(chunkZ, chunk)

    eventBus.emit(EVENTS.RENDER_CANYON_CHUNK, {
      z: chunkZ,
      width,
      obstacles,
      shards,
      chunkSize: this.chunkSize,
    })
  }

  private getCanyonWidthAt(z: number): number {
    const totalNarrow = this.state.narrowRate * this.state.narrowRateMultiplier * z
    return Math.max(this.state.minCanyonWidth, this.state.initialCanyonWidth - totalNarrow)
  }

  private generateObstacles(chunkZ: number, canyonWidth: number): ObstacleData[] {
    const obstacles: ObstacleData[] = []
    const startZ = chunkZ
    const endZ = chunkZ + this.chunkSize

    let currentZ = startZ + Math.random() * this.obstacleInterval

    while (currentZ < endZ) {
      const side = Math.random() < 0.5 ? 'left' : 'right'
      const size = 2 + Math.random() * 2

      const wallOffset = size / 2 + 1
      let x: number
      if (side === 'left') {
        x = -canyonWidth / 2 + wallOffset + Math.random() * size
      } else {
        x = canyonWidth / 2 - wallOffset - Math.random() * size
      }

      const y = (Math.random() - 0.5) * 40

      obstacles.push({
        id: `obs_${this.chunkIdCounter++}`,
        x,
        y,
        z: currentZ,
        width: size,
        height: size,
        depth: size,
      })

      currentZ += this.obstacleInterval + Math.random() * 5
    }

    return obstacles
  }

  private generateShards(chunkZ: number, canyonWidth: number): ShardData[] {
    const shards: ShardData[] = []
    const startZ = chunkZ
    const endZ = chunkZ + this.chunkSize

    let currentZ = startZ + Math.random() * (this.shardMaxInterval - this.shardMinInterval)

    while (currentZ < endZ) {
      const xRange = canyonWidth * 0.6
      const x = (Math.random() - 0.5) * xRange
      const y = (Math.random() - 0.5) * 50

      shards.push({
        id: `shard_${this.chunkIdCounter++}`,
        x,
        y,
        z: currentZ,
        collected: false,
      })

      const interval =
        this.shardMinInterval + Math.random() * (this.shardMaxInterval - this.shardMinInterval)
      currentZ += interval
    }

    return shards
  }

  private emitStateUpdates(): void {
    eventBus.emit(EVENTS.GAME_SCORE_UPDATE, {
      score: this.state.score,
      distance: this.state.distance,
      shardsCollected: this.state.shardsCollected,
      level: this.state.level,
    })

    eventBus.emit(EVENTS.GAME_ENERGY_UPDATE, {
      energy: this.state.energy,
      maxEnergy: this.state.maxEnergy,
    })
  }

  getState(): GameState {
    return { ...this.state }
  }
}
