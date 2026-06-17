import { eventBus } from './EventBus'
import { useGameStore } from './state'

export class PlayerController {
  private moveSpeed: number = 1
  private isAttached: boolean = false
  private keyDownHandler: ((e: KeyboardEvent) => void) | null = null
  private touchStartHandler: ((e: TouchEvent) => void) | null = null
  private touchEndHandler: ((e: TouchEvent) => void) | null = null
  private touchStartX: number = 0
  private targetPos: number = 1
  private isMoving: boolean = false

  attach(): void {
    if (this.isAttached) return

    this.keyDownHandler = this.handleKeyDown.bind(this)
    this.touchStartHandler = this.handleTouchStart.bind(this)
    this.touchEndHandler = this.handleTouchEnd.bind(this)

    window.addEventListener('keydown', this.keyDownHandler)
    window.addEventListener('touchstart', this.touchStartHandler)
    window.addEventListener('touchend', this.touchEndHandler)

    const state = useGameStore.getState()
    this.targetPos = state.playerPos

    this.isAttached = true
  }

  detach(): void {
    if (!this.isAttached) return

    if (this.keyDownHandler) {
      window.removeEventListener('keydown', this.keyDownHandler)
    }
    if (this.touchStartHandler) {
      window.removeEventListener('touchstart', this.touchStartHandler)
    }
    if (this.touchEndHandler) {
      window.removeEventListener('touchend', this.touchEndHandler)
    }

    this.keyDownHandler = null
    this.touchStartHandler = null
    this.touchEndHandler = null
    this.isAttached = false
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const state = useGameStore.getState()
    if (state.gameState !== 'playing') return

    switch (e.key.toLowerCase()) {
      case 'a':
      case 'arrowleft':
        this.moveLeft()
        break
      case 'd':
      case 'arrowright':
        this.moveRight()
        break
      case 's':
      case 'arrowdown':
        this.moveCenter()
        break
      case ' ':
        e.preventDefault()
        break
    }
  }

  private handleTouchStart(e: TouchEvent): void {
    const state = useGameStore.getState()
    if (state.gameState !== 'playing') return

    if (e.touches.length > 0) {
      this.touchStartX = e.touches[0].clientX
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    const state = useGameStore.getState()
    if (state.gameState !== 'playing') return

    if (e.changedTouches.length > 0) {
      const touchEndX = e.changedTouches[0].clientX
      const deltaX = touchEndX - this.touchStartX

      if (Math.abs(deltaX) > 30) {
        if (deltaX > 0) {
          this.moveRight()
        } else {
          this.moveLeft()
        }
      }
    }
  }

  moveLeft(): void {
    const state = useGameStore.getState()
    const currentPos = state.playerPos

    if (currentPos > 0) {
      this.targetPos = currentPos - 1
      this.isMoving = true
      eventBus.emit('playerMove', this.targetPos)
    }
  }

  moveRight(): void {
    const state = useGameStore.getState()
    const currentPos = state.playerPos

    if (currentPos < 2) {
      this.targetPos = currentPos + 1
      this.isMoving = true
      eventBus.emit('playerMove', this.targetPos)
    }
  }

  moveCenter(): void {
    const state = useGameStore.getState()
    const currentPos = state.playerPos

    if (currentPos !== 1) {
      this.targetPos = 1
      this.isMoving = true
      eventBus.emit('playerMove', this.targetPos)
    }
  }

  update(deltaTime: number): void {
    const state = useGameStore.getState()
    if (state.gameState !== 'playing') return

    const difficulty = state.difficulty
    const speedMultiplier = 1 - (difficulty - 1) * 0.02
    const moveSpeed = this.moveSpeed * speedMultiplier

    if (this.isMoving) {
      const currentPos = state.playerPos
      const diff = this.targetPos - currentPos

      if (Math.abs(diff) < 0.05) {
        useGameStore.getState().setPlayerPos(this.targetPos)
        this.isMoving = false
      } else {
        const moveAmount = diff * moveSpeed * deltaTime * 10
        const newPos = currentPos + moveAmount
        useGameStore.getState().setPlayerPos(newPos)
      }
    }
  }

  isAttachedToInput(): boolean {
    return this.isAttached
  }
}
