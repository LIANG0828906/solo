import { EntityManager } from './entityManager'
import { Renderer } from './renderer'
import { InputHandler } from './inputHandler'
import { checkCollisions } from './collisionSystem'
import { SoundManager } from './soundManager'
import { GameState } from './store'

export class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private entityManager: EntityManager
  private renderer: Renderer
  private inputHandler: InputHandler
  private soundManager: SoundManager
  private animationId: number | null = null
  private lastTime: number = 0
  private gameTime: number = 0
  private score: number = 0
  private lives: number = 3
  private level: number = 1
  private gameState: GameState = 'menu'

  public onScoreChange: (s: number) => void = () => {}
  public onLivesChange: (l: number) => void = () => {}
  public onLevelChange: (l: number) => void = () => {}
  public onGameOver: () => void = () => {}
  public onGameStateChange: (s: GameState) => void = () => {}

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get 2D context')
    this.ctx = ctx

    this.resize()

    const cw = canvas.width
    const ch = canvas.height
    this.entityManager = new EntityManager(cw, ch)
    this.renderer = new Renderer(ctx, cw, ch)
    this.inputHandler = new InputHandler()
    this.soundManager = new SoundManager()

    this.entityManager.setCallbacks(
      (s) => { this.score = s; this.onScoreChange(s) },
      (l) => { this.lives = l; this.onLivesChange(l) },
      (t) => { if (t === 'pew') this.soundManager.playPew(); else this.soundManager.playExplosion() }
    )

    this.inputHandler.onPause = () => {
      if (this.gameState === 'playing') {
        this.setGameState('paused')
      } else if (this.gameState === 'paused') {
        this.setGameState('playing')
      }
    }
    this.inputHandler.setCanvas(canvas)

    canvas.addEventListener('click', this.handleClick.bind(this))
    window.addEventListener('resize', this.handleResize.bind(this))
  }

  private handleResize() {
    this.resize()
    this.renderer.resize(this.canvas.width, this.canvas.height)
  }

  private resize() {
    const dpr = window.devicePixelRatio || 1
    const w = window.innerWidth
    const h = window.innerHeight
    this.canvas.width = w * dpr
    this.canvas.height = h * dpr
    this.canvas.style.width = w + 'px'
    this.canvas.style.height = h + 'px'
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  private handleClick(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cw = window.innerWidth
    const ch = window.innerHeight

    if (this.renderer.isSoundButtonClicked(cw, x, y)) {
      const newEnabled = !this.soundManager.enabled
      this.soundManager.setEnabled(newEnabled)
      const event = new CustomEvent('soundToggle', { detail: newEnabled })
      window.dispatchEvent(event)
      return
    }

    if (this.gameState === 'paused') {
      if (this.renderer.isResumeButtonClicked(cw, ch, x, y)) {
        this.setGameState('playing')
      }
    }
  }

  public setGameState(state: GameState) {
    this.gameState = state
    this.onGameStateChange(state)
  }

  public startGame() {
    const cw = window.innerWidth
    const ch = window.innerHeight
    this.entityManager.reset(cw, ch)
    this.gameTime = 0
    this.score = 0
    this.lives = 3
    this.level = 1
    this.onLevelChange(1)
    this.setGameState('playing')
    if (this.animationId === null) {
      this.lastTime = performance.now()
      this.loop(this.lastTime)
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundManager.setEnabled(enabled)
  }

  private loop(currentTime: number) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05)
    this.lastTime = currentTime

    this.update(dt)
    this.render()

    this.animationId = requestAnimationFrame(this.loop.bind(this))
  }

  private update(dt: number) {
    const cw = window.innerWidth
    const ch = window.innerHeight

    if (this.gameState === 'playing') {
      this.gameTime += dt

      const newLevel = Math.min(5, 1 + Math.floor(this.gameTime / 15))
      if (newLevel !== this.level) {
        this.level = newLevel
        this.onLevelChange(newLevel)
      }

      const input = this.inputHandler.getInput(
        cw, ch,
        this.entityManager.player.position.x,
        this.entityManager.player.position.y
      )
      this.entityManager.handleInput(input, dt, cw, ch)
      this.entityManager.update(dt, cw, ch, this.level, this.score)

      const allEntities = [this.entityManager.player, ...this.entityManager.entities]
      const collisionEvents = checkCollisions(allEntities, cw, ch)
      const gameOver = this.entityManager.handleCollisions(collisionEvents)
      if (gameOver) {
        this.setGameState('gameover')
        this.onGameOver()
      }

      this.renderer.updateStars(dt, ch)
    } else if (this.gameState === 'paused' || this.gameState === 'gameover') {
      this.renderer.updateStars(dt, ch)
    }
  }

  private render() {
    const cw = window.innerWidth
    const ch = window.innerHeight
    this.renderer.render(
      cw, ch,
      this.entityManager.player,
      this.entityManager.entities,
      this.score,
      this.lives,
      3,
      this.level,
      this.soundManager.enabled,
      this.gameState
    )
  }

  public destroy() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
    }
    this.inputHandler.destroy()
  }
}
