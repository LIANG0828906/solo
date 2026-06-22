import { InputManager } from './input'
import {
  Player,
  Bullet,
  Enemy,
  PowerUp,
  Particle,
  Star,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MAX_BULLETS,
  MAX_ENEMIES,
} from './entities'

export class GameRenderer {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  input: InputManager
  animationId: number | null = null
  lastTime: number = 0
  lastEnemySpawn: number = 0
  lastBulletShot: number = 0
  bulletInterval: number = 1000 / 8
  enemySpawnInterval: number = 1500

  player: Player
  bullets: Bullet[] = []
  enemies: Enemy[] = []
  powerUps: PowerUp[] = []
  particles: Particle[] = []
  stars: Star[]
  score: number = 0
  isGameOver: boolean = false
  flashAlpha: number = 0
  flashStartTime: number = 0
  scoreForNextLife: number = 500

  onScoreChange: ((score: number) => void) | null = null
  onGameOverChange: ((over: boolean) => void) | null = null
  onLivesChange: ((lives: number) => void) | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.canvas.width = CANVAS_WIDTH
    this.canvas.height = CANVAS_HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context not available')
    this.ctx = ctx
    this.input = new InputManager(canvas)
    this.player = new Player()
    this.stars = []
    for (let i = 0; i < 100; i++) {
      this.stars.push(new Star())
    }
  }

  start() {
    this.input.start()
    this.lastTime = performance.now()
    this.lastEnemySpawn = this.lastTime
    this.lastBulletShot = this.lastTime
    this.animationId = requestAnimationFrame(this.loop)
    window.addEventListener('keydown', this.handleRestart)
  }

  stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    this.input.stop()
    window.removeEventListener('keydown', this.handleRestart)
  }

  handleRestart = (e: KeyboardEvent) => {
    if (this.isGameOver && e.key) {
      this.resetGame()
    }
  }

  resetGame() {
    this.player = new Player()
    this.bullets = []
    this.enemies = []
    this.powerUps = []
    this.particles = []
    this.score = 0
    this.isGameOver = false
    this.flashAlpha = 0
    this.scoreForNextLife = 500
    this.lastEnemySpawn = performance.now()
    this.lastBulletShot = performance.now()
    if (this.onScoreChange) this.onScoreChange(this.score)
    if (this.onGameOverChange) this.onGameOverChange(false)
    if (this.onLivesChange) this.onLivesChange(this.player.lives)
  }

  loop = (timestamp: number) => {
    const deltaTime = timestamp - this.lastTime
    this.lastTime = timestamp

    if (!this.isGameOver) {
      this.update(timestamp, deltaTime)
    }
    this.render(timestamp)

    this.animationId = requestAnimationFrame(this.loop)
  }

  update(now: number, deltaTime: number) {
    this.player.update(this.input.keys, now)

    if (this.input.isMouseDown && now - this.lastBulletShot >= this.bulletInterval) {
      this.shoot(now)
      this.lastBulletShot = now
    }

    if (now - this.lastEnemySpawn >= this.enemySpawnInterval) {
      this.spawnEnemy(now)
      this.lastEnemySpawn = now
    }

    for (const bullet of this.bullets) {
      bullet.update()
    }
    this.bullets = this.bullets.filter((b) => !b.isOffScreen())

    for (const enemy of this.enemies) {
      enemy.update()
    }
    this.enemies = this.enemies.filter((e) => !e.isOffScreen())

    for (const powerUp of this.powerUps) {
      powerUp.update()
    }
    this.powerUps = this.powerUps.filter((p) => !p.isExpired(now) && !p.isOffScreen())

    for (const particle of this.particles) {
      particle.update()
    }
    this.particles = this.particles.filter((p) => !p.isExpired(now))

    this.checkCollisions(now)

    if (this.flashAlpha > 0) {
      const elapsed = now - this.flashStartTime
      this.flashAlpha = Math.max(0, 1 - elapsed / 200)
    }
  }

  shoot(now: number) {
    const bullet = new Bullet(
      this.player.x,
      this.player.y - this.player.size,
      this.input.mouseX,
      this.input.mouseY,
      now
    )
    this.bullets.push(bullet)
    if (this.bullets.length > MAX_BULLETS) {
      this.bullets.shift()
    }
  }

  spawnEnemy(now: number) {
    const enemy = new Enemy(now)
    this.enemies.push(enemy)
    if (this.enemies.length > MAX_ENEMIES) {
      this.enemies.shift()
    }
  }

  checkCollisions(now: number) {
    const bulletsToRemove = new Set<string>()
    const enemiesToRemove = new Set<string>()

    for (const bullet of this.bullets) {
      for (const enemy of this.enemies) {
        const dx = bullet.x - enemy.x
        const dy = bullet.y - enemy.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < bullet.radius + enemy.radius) {
          bulletsToRemove.add(bullet.id)
          enemiesToRemove.add(enemy.id)
          this.spawnExplosion(enemy.x, enemy.y, now)

          const points = this.player.isPoweredUp ? 20 : 10
          this.addScore(points)

          if (Math.random() < 0.4) {
            this.spawnPowerUp(enemy.x, enemy.y, now)
          }
          break
        }
      }
    }

    this.bullets = this.bullets.filter((b) => !bulletsToRemove.has(b.id))
    this.enemies = this.enemies.filter((e) => !enemiesToRemove.has(e.id))

    if (!this.player.isShielded) {
      for (const enemy of this.enemies) {
        if (this.player.collidesWith(enemy)) {
          const isDead = this.player.takeDamage()
          if (this.onLivesChange) this.onLivesChange(this.player.lives)
          if (isDead) {
            this.isGameOver = true
            if (this.onGameOverChange) this.onGameOverChange(true)
          } else {
            enemiesToRemove.add(enemy.id)
            this.spawnExplosion(enemy.x, enemy.y, now)
          }
          break
        }
      }
      this.enemies = this.enemies.filter((e) => !enemiesToRemove.has(e.id))
    }

    const powerUpsToRemove = new Set<string>()
    for (const powerUp of this.powerUps) {
      if (this.player.collidesWith(powerUp)) {
        powerUpsToRemove.add(powerUp.id)
        this.activateRandomPowerUp(now)
      }
    }
    this.powerUps = this.powerUps.filter((p) => !powerUpsToRemove.has(p.id))
  }

  spawnExplosion(x: number, y: number, now: number) {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6
      const speed = 2 + Math.random() * 2
      const particle = new Particle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        now
      )
      this.particles.push(particle)
    }
  }

  spawnPowerUp(x: number, y: number, now: number) {
    const powerUp = new PowerUp(x, y, now)
    this.powerUps.push(powerUp)
  }

  activateRandomPowerUp(now: number) {
    if (Math.random() < 0.5) {
      this.player.activateShield(3000, now)
    } else {
      this.clearScreen(now)
    }
  }

  clearScreen(now: number) {
    for (const enemy of this.enemies) {
      this.spawnExplosion(enemy.x, enemy.y, now)
    }
    this.enemies = []
    this.bullets = []
    this.flashAlpha = 1
    this.flashStartTime = now
  }

  addScore(points: number) {
    this.score += points
    if (this.score >= this.scoreForNextLife) {
      this.player.addLife()
      this.scoreForNextLife += 500
      if (this.onLivesChange) this.onLivesChange(this.player.lives)
    }
    if (this.onScoreChange) this.onScoreChange(this.score)
  }

  render(now: number) {
    const ctx = this.ctx

    ctx.fillStyle = '#0B0C10'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    this.renderStars()
    this.renderParticles(now)
    this.renderPowerUps(now)
    this.renderEnemies()
    this.renderBullets()
    this.renderPlayer(now)
    this.renderUI()

    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }

    if (this.isGameOver) {
      this.renderGameOver()
    }
  }

  renderStars() {
    const ctx = this.ctx
    for (const star of this.stars) {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  renderPlayer(now: number) {
    const ctx = this.ctx
    const { x, y, size, color } = this.player

    const speed = this.player.speed
    const isMoving = this.input.keys.size > 0
    const tailIntensity = isMoving ? 1 : 0.3

    ctx.save()
    for (let i = 0; i < 3; i++) {
      const offsetX = (i - 1) * 6
      const tailSize = (size * 0.6 - i * 3) * tailIntensity
      const tailY = y + size * 0.7 + i * 8
      const alpha = (0.6 - i * 0.15) * tailIntensity

      ctx.fillStyle = `rgba(255, 165, 0, ${alpha})`
      ctx.beginPath()
      ctx.moveTo(x + offsetX, tailY + tailSize)
      ctx.lineTo(x + offsetX - tailSize / 2, tailY)
      ctx.lineTo(x + offsetX + tailSize / 2, tailY)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(x, y - size)
    ctx.lineTo(x - size * 0.866, y + size * 0.5)
    ctx.lineTo(x + size * 0.866, y + size * 0.5)
    ctx.closePath()
    ctx.fill()

    if (this.player.isShielded) {
      const scale = this.player.getShieldScale(now)
      const shieldRadius = size * 1.5 * scale
      ctx.strokeStyle = '#FFD700'
      ctx.lineWidth = 3
      ctx.globalAlpha = 0.8
      ctx.beginPath()
      ctx.arc(x, y, shieldRadius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }

  renderBullets() {
    const ctx = this.ctx
    for (const bullet of this.bullets) {
      ctx.fillStyle = bullet.color
      ctx.beginPath()
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  renderEnemies() {
    const ctx = this.ctx
    for (const enemy of this.enemies) {
      this.drawHexagon(enemy.x, enemy.y, enemy.radius, enemy.color)
    }
  }

  drawHexagon(x: number, y: number, radius: number, color: string) {
    const ctx = this.ctx
    ctx.fillStyle = color
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2
      const px = x + Math.cos(angle) * radius
      const py = y + Math.sin(angle) * radius
      if (i === 0) {
        ctx.moveTo(px, py)
      } else {
        ctx.lineTo(px, py)
      }
    }
    ctx.closePath()
    ctx.fill()
  }

  renderPowerUps(now: number) {
    const ctx = this.ctx
    for (const powerUp of this.powerUps) {
      const remaining = powerUp.lifetime - (now - powerUp.createdAt)
      const alpha = remaining < 1000 ? remaining / 1000 : 1
      ctx.globalAlpha = alpha
      this.drawOctagon(powerUp.x, powerUp.y, powerUp.radius, powerUp.color)
      ctx.globalAlpha = 1
    }
  }

  drawOctagon(x: number, y: number, radius: number, color: string) {
    const ctx = this.ctx
    ctx.fillStyle = color
    ctx.beginPath()
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i - Math.PI / 8
      const px = x + Math.cos(angle) * radius
      const py = y + Math.sin(angle) * radius
      if (i === 0) {
        ctx.moveTo(px, py)
      } else {
        ctx.lineTo(px, py)
      }
    }
    ctx.closePath()
    ctx.fill()
  }

  renderParticles(now: number) {
    const ctx = this.ctx
    for (const particle of this.particles) {
      const alpha = particle.getAlpha(now)
      ctx.globalAlpha = alpha
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  renderUI() {
    const ctx = this.ctx
    ctx.font = '16px monospace'
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'left'
    ctx.fillText(`分数: ${this.score}`, 20, 30)

    ctx.fillText(`生命:`, 20, 55)
    for (let i = 0; i < this.player.lives; i++) {
      const hx = 80 + i * 25
      const hy = 50
      ctx.fillStyle = '#00FFD1'
      ctx.beginPath()
      ctx.moveTo(hx, hy - 8)
      ctx.lineTo(hx - 7, hy + 4)
      ctx.lineTo(hx + 7, hy + 4)
      ctx.closePath()
      ctx.fill()
    }
  }

  renderGameOver() {
    const ctx = this.ctx
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.font = 'bold 48px monospace'
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.fillText('游戏结束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30)

    ctx.font = '20px monospace'
    ctx.fillText(`最终分数: ${this.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)

    ctx.font = '16px monospace'
    ctx.fillStyle = '#AAAAAA'
    ctx.fillText('按任意键重新开始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60)
  }
}
