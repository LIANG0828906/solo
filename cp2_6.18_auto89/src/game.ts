import {
  ARENA_SIZE,
  ARENA_PADDING,
  Player,
  Obstacle,
  Energy,
  Particle,
  createPlayer,
  createObstacle,
  createEnergy,
  createCollectParticles,
  createHitParticles,
  updatePlayer,
  updateObstacle,
  updateEnergy,
  updateParticle,
  checkCircleCollision,
  renderPlayer,
  renderObstacle,
  renderEnergy,
  renderParticle,
} from './entities'

import {
  UIState,
  createUIState,
  updateUI,
  renderArenaBackground,
  renderHUD,
  renderGameOverPanel,
} from './ui'

interface ScreenEffect {
  shakeTimer: number
  shakeMagnitude: number
  flashTimer: number
  flashColor: string
}

export class Game {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private running: boolean = false
  private animationId: number = 0
  private lastTime: number = 0

  private player!: Player
  private obstacles: Obstacle[] = []
  private energies: Energy[] = []
  private particles: Particle[] = []
  private ui!: UIState
  private effects!: ScreenEffect

  private elapsedTime: number = 0
  private obstacleSpawnTimer: number = 0
  private energySpawnTimer: number = 0
  private difficultyTier: number = 0
  private baseObstacleInterval: number = 1.2
  private maxObstacleRadius: number = 25

  private gameOverButton: { x: number; y: number; w: number; h: number } | null = null
  private pointerDownOnButton: boolean = false

  private isPointerDown: boolean = false

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get 2D context')
    this.ctx = ctx
    this.reset()
    this.bindEvents()
  }

  private reset(): void {
    this.player = createPlayer()
    this.obstacles = []
    this.energies = []
    this.particles = []
    this.ui = createUIState()
    this.effects = {
      shakeTimer: 0,
      shakeMagnitude: 0,
      flashTimer: 0,
      flashColor: 'rgba(255, 0, 0, 0)',
    }
    this.elapsedTime = 0
    this.obstacleSpawnTimer = 0
    this.energySpawnTimer = 0
    this.difficultyTier = 0
    this.maxObstacleRadius = 25
    this.gameOverButton = null
    this.pointerDownOnButton = false

    for (let i = 0; i < 2; i++) {
      this.energies.push(createEnergy())
    }
  }

  private bindEvents(): void {
    const canvas = this.canvas

    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('pointercancel', this.onPointerUp)
    canvas.addEventListener('pointerleave', this.onPointerUp)
  }

  public destroy(): void {
    const canvas = this.canvas
    canvas.removeEventListener('pointerdown', this.onPointerDown)
    canvas.removeEventListener('pointermove', this.onPointerMove)
    canvas.removeEventListener('pointerup', this.onPointerUp)
    canvas.removeEventListener('pointercancel', this.onPointerUp)
    canvas.removeEventListener('pointerleave', this.onPointerUp)
    this.stop()
  }

  private getArenaTransform(): { offsetX: number; offsetY: number; scale: number } {
    const totalSize = ARENA_PADDING * 2 + ARENA_SIZE
    const cw = this.canvas.width
    const ch = this.canvas.height
    const scale = Math.min(cw / totalSize, ch / totalSize)
    const offsetX = (cw - totalSize * scale) / 2
    const offsetY = (ch - totalSize * scale) / 2
    return { offsetX, offsetY, scale }
  }

  private screenToArena(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    const sx = (clientX - rect.left) * (this.canvas.width / rect.width)
    const sy = (clientY - rect.top) * (this.canvas.height / rect.height)
    const { offsetX, offsetY, scale } = this.getArenaTransform()
    const x = (sx - offsetX) / scale
    const y = (sy - offsetY) / scale
    return { x, y }
  }

  private screenToCanvas(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: (clientX - rect.left) * (this.canvas.width / rect.width),
      y: (clientY - rect.top) * (this.canvas.height / rect.height),
    }
  }

  private onPointerDown = (e: PointerEvent): void => {
    e.preventDefault()
    const { x: cx, y: cy } = this.screenToCanvas(e.clientX, e.clientY)

    if (this.ui.gameOver && this.gameOverButton) {
      const b = this.gameOverButton
      if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) {
        this.pointerDownOnButton = true
        return
      }
    }

    this.isPointerDown = true
    if (!this.ui.gameOver) {
      const pos = this.screenToArena(e.clientX, e.clientY)
      this.player.targetX = pos.x
      this.player.targetY = pos.y
    }
  }

  private onPointerMove = (e: PointerEvent): void => {
    if (this.ui.gameOver) return
    if (!this.isPointerDown) return
    e.preventDefault()
    const pos = this.screenToArena(e.clientX, e.clientY)
    this.player.targetX = pos.x
    this.player.targetY = pos.y
  }

  private onPointerUp = (e: PointerEvent): void => {
    if (this.pointerDownOnButton && this.ui.gameOver && this.gameOverButton) {
      const { x: cx, y: cy } = this.screenToCanvas(e.clientX, e.clientY)
      const b = this.gameOverButton
      if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) {
        this.reset()
      }
    }
    this.pointerDownOnButton = false
    this.isPointerDown = false
  }

  public start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.loop(this.lastTime)
  }

  public stop(): void {
    this.running = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = 0
    }
  }

  private loop = (now: number): void => {
    if (!this.running) return
    this.animationId = requestAnimationFrame(this.loop)

    const deltaTime = Math.min(0.05, (now - this.lastTime) / 1000)
    this.lastTime = now

    this.update(deltaTime)
    this.render()
  }

  private update(deltaTime: number): void {
    updateUI(this.ui, deltaTime)

    if (this.effects.shakeTimer > 0) {
      this.effects.shakeTimer -= deltaTime
    }
    if (this.effects.flashTimer > 0) {
      this.effects.flashTimer -= deltaTime
    }

    if (this.ui.gameOver) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        if (updateParticle(this.particles[i], deltaTime)) {
          this.particles.splice(i, 1)
        }
      }
      return
    }

    this.elapsedTime += deltaTime

    const newTier = Math.floor(this.elapsedTime / 30)
    if (newTier > this.difficultyTier) {
      this.difficultyTier = newTier
      this.maxObstacleRadius = Math.min(40, 25 + this.difficultyTier * 2)
    }

    const speedMultiplier = Math.pow(1.1, this.difficultyTier)
    const obstacleInterval = this.baseObstacleInterval / speedMultiplier

    this.obstacleSpawnTimer += deltaTime
    while (this.obstacleSpawnTimer >= obstacleInterval) {
      this.obstacleSpawnTimer -= obstacleInterval
      const obs = createObstacle(this.maxObstacleRadius)
      obs.dx *= speedMultiplier
      obs.dy *= speedMultiplier
      this.obstacles.push(obs)
    }

    this.energySpawnTimer += deltaTime
    while (this.energySpawnTimer >= 3) {
      this.energySpawnTimer -= 3
      if (this.energies.length < 5) {
        this.energies.push(createEnergy())
      }
    }

    updatePlayer(this.player, deltaTime)

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const outOfBounds = updateObstacle(this.obstacles[i], deltaTime)
      if (outOfBounds) {
        this.obstacles.splice(i, 1)
      }
    }

    for (const energy of this.energies) {
      updateEnergy(energy, deltaTime)
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      if (updateParticle(this.particles[i], deltaTime)) {
        this.particles.splice(i, 1)
      }
    }

    this.checkCollisions()
  }

  private checkCollisions(): void {
    const p = this.player

    for (let i = this.energies.length - 1; i >= 0; i--) {
      const e = this.energies[i]
      if (checkCircleCollision(p.x, p.y, p.radius, e.x, e.y, e.radius)) {
        this.energies.splice(i, 1)
        const comboBonus = Math.floor(this.ui.combo)
        this.ui.score += 10 + comboBonus
        this.ui.combo = Math.min(10, this.ui.combo + 0.5)
        if (this.ui.combo > this.ui.maxCombo) {
          this.ui.maxCombo = this.ui.combo
        }
        this.ui.comboAnimTimer = 0.25
        this.particles.push(...createCollectParticles(e.x, e.y))
        this.addShake(0.08, 2)
      }
    }

    if (p.invincibleTimer <= 0) {
      for (let i = 0; i < this.obstacles.length; i++) {
        const o = this.obstacles[i]
        if (checkCircleCollision(p.x, p.y, p.radius, o.x, o.y, o.radius)) {
          this.onPlayerHit()
          break
        }
      }
    }
  }

  private onPlayerHit(): void {
    this.ui.lives -= 1
    this.ui.combo = 1
    this.player.invincibleTimer = 1
    this.player.blinkTimer = 0
    this.player.hitFlashTimer = 0.2

    this.effects.flashTimer = 0.2
    this.effects.flashColor = 'rgba(255, 0, 0, 0.35)'

    this.particles.push(...createHitParticles(this.player.x, this.player.y))
    this.addShake(0.12, 3)

    if (this.ui.lives <= 0) {
      this.endGame()
    }
  }

  private endGame(): void {
    this.ui.gameOver = true
    this.ui.finalScore = this.ui.score
    this.ui.survivalTime = this.elapsedTime
    this.ui.finalMaxCombo = this.ui.maxCombo
  }

  private addShake(duration: number, magnitude: number): void {
    this.effects.shakeTimer = Math.max(this.effects.shakeTimer, duration)
    this.effects.shakeMagnitude = Math.max(this.effects.shakeMagnitude, magnitude)
  }

  private render(): void {
    const ctx = this.ctx
    const cw = this.canvas.width
    const ch = this.canvas.height

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, cw, ch)

    let shakeX = 0
    let shakeY = 0
    if (this.effects.shakeTimer > 0) {
      const m = this.effects.shakeMagnitude
      shakeX = (Math.random() - 0.5) * m * 2
      shakeY = (Math.random() - 0.5) * m * 2
    }

    ctx.translate(shakeX, shakeY)

    const { offsetX, offsetY, scale } = this.getArenaTransform()

    renderArenaBackground(ctx, offsetX, offsetY, scale)

    ctx.save()
    ctx.translate(offsetX, offsetY)
    ctx.scale(scale, scale)

    for (const energy of this.energies) {
      renderEnergy(ctx, energy)
    }

    for (const obstacle of this.obstacles) {
      renderObstacle(ctx, obstacle)
    }

    renderPlayer(ctx, this.player)

    for (const particle of this.particles) {
      renderParticle(ctx, particle)
    }

    ctx.restore()

    renderHUD(ctx, this.ui, offsetX, offsetY, scale)

    if (this.effects.flashTimer > 0) {
      ctx.save()
      ctx.globalAlpha = Math.min(1, this.effects.flashTimer / 0.2)
      ctx.fillStyle = this.effects.flashColor
      ctx.fillRect(0, 0, cw, ch)
      ctx.restore()
    }

    if (this.ui.gameOver) {
      const result = renderGameOverPanel(ctx, this.ui, cw, ch, scale)
      this.gameOverButton = result.button
    } else {
      this.gameOverButton = null
    }
  }
}
