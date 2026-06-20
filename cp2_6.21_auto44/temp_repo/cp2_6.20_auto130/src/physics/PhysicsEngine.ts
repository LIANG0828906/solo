import type { CellValue, PlayerState, InputState, GameObject } from '../types'

const GRAVITY = 0.5
const MOVE_SPEED = 3
const JUMP_FORCE = -10
const MAX_FALL_SPEED = 12
const PLAYER_WIDTH = 16
const PLAYER_HEIGHT = 16

export class PhysicsEngine {
  private grid: CellValue[][] = []
  private objects: GameObject[] = []
  private cellSize: number = 32
  private player: PlayerState = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    onGround: false,
  }
  private input: InputState = {
    left: false,
    right: false,
    jump: false,
  }
  private animationFrameId: number | null = null
  private lastTime: number = 0
  private onUpdate: ((player: PlayerState, collectedCoins: string[]) => void) | null = null
  private collectedCoins: Set<string> = new Set()
  private gameOver: boolean = false
  private movingPlatformStates: Map<string, { x: number; direction: number }> = new Map()
  private gridCols: number = 12
  private gridRows: number = 8

  constructor(cellSize: number = 32) {
    this.cellSize = cellSize
  }

  setGrid(grid: CellValue[][], cols: number, rows: number) {
    this.grid = grid
    this.gridCols = cols
    this.gridRows = rows
  }

  setObjects(objects: GameObject[]) {
    this.objects = objects
    this.movingPlatformStates.clear()
    for (const obj of objects) {
      if (obj.type === 'movingPlatform') {
        this.movingPlatformStates.set(obj.id, {
          x: obj.gridX,
          direction: obj.platformDirection || 1,
        })
      }
    }
  }

  setOnUpdate(callback: (player: PlayerState, collectedCoins: string[]) => void) {
    this.onUpdate = callback
  }

  setInput(input: InputState) {
    this.input = { ...input }
  }

  setCellSize(size: number) {
    this.cellSize = size
  }

  resetPlayer(gridX: number, gridY: number) {
    this.player.x = gridX * this.cellSize + (this.cellSize - PLAYER_WIDTH) / 2
    this.player.y = gridY * this.cellSize + (this.cellSize - PLAYER_HEIGHT)
    this.player.vx = 0
    this.player.vy = 0
    this.player.onGround = false
    this.collectedCoins.clear()
    this.gameOver = false
  }

  getPlayer(): PlayerState {
    return { ...this.player }
  }

  getCollectedCoins(): string[] {
    return Array.from(this.collectedCoins)
  }

  isGameOver(): boolean {
    return this.gameOver
  }

  getMovingPlatformPosition(objId: string): number {
    const state = this.movingPlatformStates.get(objId)
    return state ? state.x : 0
  }

  start() {
    if (this.animationFrameId !== null) return
    this.lastTime = performance.now()
    this.gameOver = false
    this.loop()
  }

  stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private loop = () => {
    const now = performance.now()
    const deltaTime = (now - this.lastTime) / 16.67
    this.lastTime = now

    if (!this.gameOver) {
      this.update(deltaTime)
    }

    if (this.onUpdate) {
      this.onUpdate(this.player, Array.from(this.collectedCoins))
    }

    this.animationFrameId = requestAnimationFrame(this.loop)
  }

  private update(deltaTime: number) {
    this.updateMovingPlatforms(deltaTime)

    if (this.input.left) {
      this.player.vx = -MOVE_SPEED
    } else if (this.input.right) {
      this.player.vx = MOVE_SPEED
    } else {
      this.player.vx = 0
    }

    if (this.input.jump && this.player.onGround) {
      this.player.vy = JUMP_FORCE
      this.player.onGround = false
    }

    this.player.vy += GRAVITY * deltaTime
    if (this.player.vy > MAX_FALL_SPEED) {
      this.player.vy = MAX_FALL_SPEED
    }

    this.moveHorizontal(this.player.vx * deltaTime)
    this.moveVertical(this.player.vy * deltaTime)

    this.checkCollisions()

    if (this.player.y > this.gridRows * this.cellSize + 100) {
      this.gameOver = true
    }
  }

  private updateMovingPlatforms(deltaTime: number) {
    for (const obj of this.objects) {
      if (obj.type !== 'movingPlatform') continue
      const state = this.movingPlatformStates.get(obj.id)
      if (!state) continue

      const range = obj.platformRange || 3
      const speed = (obj.platformSpeed || 1) * 0.02 * deltaTime

      state.x += state.direction * speed

      const originalX = obj.platformOriginalX ?? obj.gridX
      if (state.x > originalX + range) {
        state.x = originalX + range
        state.direction = -1
      } else if (state.x < originalX) {
        state.x = originalX
        state.direction = 1
      }
    }
  }

  private moveHorizontal(dx: number) {
    this.player.x += dx

    if (this.isCollidingWithTerrain()) {
      this.player.x -= dx
      this.player.vx = 0
    }

    if (this.player.x < 0) {
      this.player.x = 0
      this.player.vx = 0
    }
    if (this.player.x + this.player.width > this.gridCols * this.cellSize) {
      this.player.x = this.gridCols * this.cellSize - this.player.width
      this.player.vx = 0
    }
  }

  private moveVertical(dy: number) {
    this.player.y += dy
    this.player.onGround = false

    if (this.isCollidingWithTerrain()) {
      this.player.y -= dy
      if (dy > 0) {
        this.player.onGround = true
      }
      this.player.vy = 0
    }

    this.checkMovingPlatformCollision(dy)
  }

  private isCollidingWithTerrain(): boolean {
    const left = Math.floor(this.player.x / this.cellSize)
    const right = Math.floor((this.player.x + this.player.width - 1) / this.cellSize)
    const top = Math.floor(this.player.y / this.cellSize)
    const bottom = Math.floor((this.player.y + this.player.height - 1) / this.cellSize)

    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        if (row >= 0 && row < this.gridRows && col >= 0 && col < this.gridCols) {
          if (this.grid[row] && this.grid[row][col] === 1) {
            return true
          }
        }
      }
    }
    return false
  }

  private checkMovingPlatformCollision(dy: number) {
    for (const obj of this.objects) {
      if (obj.type !== 'movingPlatform') continue
      const state = this.movingPlatformStates.get(obj.id)
      if (!state) continue

      const platX = state.x * this.cellSize
      const platY = obj.gridY * this.cellSize
      const platW = this.cellSize
      const platH = this.cellSize / 4

      if (
        this.player.x + this.player.width > platX &&
        this.player.x < platX + platW &&
        this.player.y + this.player.height > platY &&
        this.player.y < platY + platH
      ) {
        if (dy > 0 && this.player.vy >= 0) {
          this.player.y = platY - this.player.height
          this.player.vy = 0
          this.player.onGround = true
        }
      }
    }
  }

  private checkCollisions() {
    for (const obj of this.objects) {
      if (obj.type === 'coin' && !this.collectedCoins.has(obj.id)) {
        const coinX = obj.gridX * this.cellSize + this.cellSize / 2
        const coinY = obj.gridY * this.cellSize + this.cellSize / 2
        const coinR = this.cellSize / 4

        const playerCenterX = this.player.x + this.player.width / 2
        const playerCenterY = this.player.y + this.player.height / 2

        const dx = playerCenterX - coinX
        const dy = playerCenterY - coinY
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < coinR + this.player.width / 2) {
          this.collectedCoins.add(obj.id)
        }
      }

      if (obj.type === 'spike') {
        const spikeX = obj.gridX * this.cellSize
        const spikeY = obj.gridY * this.cellSize + this.cellSize / 2
        const spikeW = this.cellSize
        const spikeH = this.cellSize / 2

        if (
          this.player.x + this.player.width > spikeX + 4 &&
          this.player.x < spikeX + spikeW - 4 &&
          this.player.y + this.player.height > spikeY + 4 &&
          this.player.y < spikeY + spikeH
        ) {
          this.gameOver = true
        }
      }
    }
  }
}
