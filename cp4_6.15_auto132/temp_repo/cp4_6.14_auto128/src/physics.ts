import { CharacterState, LevelElement, PlatformElement, SpikeElement, CoinElement, GoalElement } from './store'

const GRAVITY = 800
const MOVE_SPEED = 200
const JUMP_VELOCITY = 400
const FIXED_DT = 1 / 60

export interface PhysicsState {
  character: CharacterState
  keys: Set<string>
  elements: LevelElement[]
  onCoinCollect: (id: string) => void
  onHit: () => void
  onWin: () => void
  updateCharacter: (updates: Partial<CharacterState>) => void
}

export class PhysicsEngine {
  private state: PhysicsState
  private accumulator = 0
  private lastTime = 0
  private animationId: number | null = null
  private isRunning = false

  constructor(state: PhysicsState) {
    this.state = state
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true
    this.lastTime = performance.now()
    this.accumulator = 0
    this.loop()
  }

  stop() {
    this.isRunning = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  setElements(elements: LevelElement[]) {
    this.state.elements = elements
  }

  private loop = () => {
    if (!this.isRunning) return

    const now = performance.now()
    let frameTime = (now - this.lastTime) / 1000
    this.lastTime = now

    if (frameTime > 0.25) frameTime = 0.25

    this.accumulator += frameTime

    while (this.accumulator >= FIXED_DT) {
      this.update(FIXED_DT)
      this.accumulator -= FIXED_DT
    }

    this.animationId = requestAnimationFrame(this.loop)
  }

  private update(dt: number) {
    const { character, keys, elements } = this.state

    let vx = 0
    if (keys.has('ArrowLeft') || keys.has('KeyA')) {
      vx = -MOVE_SPEED
    }
    if (keys.has('ArrowRight') || keys.has('KeyD')) {
      vx = MOVE_SPEED
    }

    let vy = character.vy + GRAVITY * dt

    if ((keys.has('Space') || keys.has('ArrowUp') || keys.has('KeyW')) && character.onGround) {
      vy = -JUMP_VELOCITY
    }

    let newX = character.x + vx * dt
    let newY = character.y + vy * dt

    let onGround = false

    const platforms = elements.filter((el): el is PlatformElement => el.type === 'platform')

    for (const platform of platforms) {
      if (this.checkAABBCollision(newX, character.y, character.width, character.height, platform)) {
        if (vx > 0) {
          newX = platform.x - character.width
        } else if (vx < 0) {
          newX = platform.x + platform.width
        }
      }
    }

    for (const platform of platforms) {
      if (this.checkAABBCollision(newX, newY, character.width, character.height, platform)) {
        if (vy > 0) {
          newY = platform.y - character.height
          vy = 0
          onGround = true
        } else if (vy < 0) {
          newY = platform.y + platform.height
          vy = 0
        }
      }
    }

    const canvasWidth = typeof window !== 'undefined' ? window.innerWidth - 80 : 1000
    const canvasHeight = 600

    if (newX < 0) newX = 0
    if (newX > canvasWidth - character.width) newX = canvasWidth - character.width
    if (newY > canvasHeight) {
      this.state.onHit()
      return
    }

    const spikes = elements.filter((el): el is SpikeElement => el.type === 'spike')
    for (const spike of spikes) {
      if (this.checkAABBCollision(newX, newY, character.width, character.height, spike)) {
        this.state.onHit()
        return
      }
    }

    const coins = elements.filter((el): el is CoinElement => el.type === 'coin' && !el.collected)
    for (const coin of coins) {
      if (this.checkCircleCollision(newX, newY, character.width, character.height, coin.x, coin.y, coin.radius)) {
        this.state.onCoinCollect(coin.id)
      }
    }

    const goals = elements.filter((el): el is GoalElement => el.type === 'goal')
    for (const goal of goals) {
      if (this.checkAABBCollision(newX, newY, character.width, character.height, goal)) {
        this.state.onWin()
        return
      }
    }

    this.state.updateCharacter({
      x: newX,
      y: newY,
      vx,
      vy,
      onGround,
    })
  }

  private checkAABBCollision(
    x: number,
    y: number,
    w: number,
    h: number,
    rect: { x: number; y: number; width: number; height: number }
  ): boolean {
    return x < rect.x + rect.width && x + w > rect.x && y < rect.y + rect.height && y + h > rect.y
  }

  private checkCircleCollision(
    rx: number,
    ry: number,
    rw: number,
    rh: number,
    cx: number,
    cy: number,
    cr: number
  ): boolean {
    const closestX = Math.max(rx, Math.min(cx, rx + rw))
    const closestY = Math.max(ry, Math.min(cy, ry + rh))
    const distanceX = cx - closestX
    const distanceY = cy - closestY
    return distanceX * distanceX + distanceY * distanceY < cr * cr
  }
}
