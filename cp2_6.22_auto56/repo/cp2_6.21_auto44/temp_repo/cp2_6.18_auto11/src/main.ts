import { PhysicsModule } from './engine/PhysicsModule'
import { GameModule } from './engine/GameModule'
import { RenderModule } from './render/RenderModule'
import { UIModule } from './ui/UIModule'
import { eventBus, EVENTS } from './core/EventBus'

class GameApp {
  private physicsModule: PhysicsModule
  private gameModule: GameModule
  private renderModule: RenderModule
  private uiModule: UIModule

  private isRunning: boolean = false
  private lastTime: number = 0
  private animationFrameId: number | null = null

  private mouseX: number = 0
  private mouseY: number = 0

  constructor() {
    this.physicsModule = new PhysicsModule()
    this.gameModule = new GameModule()
    this.renderModule = new RenderModule()
    this.uiModule = new UIModule()
  }

  init(container: HTMLElement): void {
    this.renderModule.init(container)
    this.uiModule.init(container)

    this.setupInput()

    this.isRunning = false
  }

  start(): void {
    if (this.isRunning) return

    this.gameModule.start()

    this.isRunning = true
    this.lastTime = performance.now()
    this.gameLoop()
  }

  private setupInput(): void {
    document.addEventListener('mousemove', this.handleMouseMove.bind(this))
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
  }

  private handleMouseMove(e: MouseEvent): void {
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    const normalizedX = (e.clientX - centerX) / centerX
    const normalizedY = (e.clientY - centerY) / centerY

    this.mouseX = Math.max(-1, Math.min(1, normalizedX))
    this.mouseY = Math.max(-1, Math.min(1, normalizedY))

    eventBus.emit(EVENTS.INPUT_MOUSE_MOVE, {
      x: this.mouseX,
      y: this.mouseY,
    })
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault()

    if (e.touches.length > 0) {
      const touch = e.touches[0]
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2

      const normalizedX = (touch.clientX - centerX) / centerX
      const normalizedY = (touch.clientY - centerY) / centerY

      this.mouseX = Math.max(-1, Math.min(1, normalizedX))
      this.mouseY = Math.max(-1, Math.min(1, normalizedY))

      eventBus.emit(EVENTS.INPUT_MOUSE_MOVE, {
        x: this.mouseX,
        y: this.mouseY,
      })
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      eventBus.emit(EVENTS.GAME_PAUSE, { paused: false })
    }
    if (e.key === 'r' || e.key === 'R') {
      eventBus.emit(EVENTS.GAME_RESTART)
    }
  }

  private gameLoop(): void {
    if (!this.isRunning) return

    const currentTime = performance.now()
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1)
    this.lastTime = currentTime

    this.physicsModule.update(deltaTime, currentTime)
    this.renderModule.update(deltaTime)

    this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this))
  }

  stop(): void {
    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  dispose(): void {
    this.stop()
    this.renderModule.dispose()
    this.uiModule.dispose()
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this))
    document.removeEventListener('touchmove', this.handleTouchMove.bind(this))
    document.removeEventListener('keydown', this.handleKeyDown.bind(this))
  }
}

const game = new GameApp()

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('game-container')
  if (container) {
    game.init(container)
  }
})

export { GameApp, game }
