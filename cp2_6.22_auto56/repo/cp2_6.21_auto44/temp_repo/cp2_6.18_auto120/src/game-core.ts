import { v4 as uuidv4 } from 'uuid'

const CANVAS_SIZE = 800
const CENTER_X = CANVAS_SIZE / 2
const CENTER_Y = CANVAS_SIZE / 2

const PLANET_RADIUS = 60
const ORBIT_RADII = [200, 300, 400]
const DEFENSE_RING_RADIUS = 300
const DEFENSE_RING_ARC = Math.PI / 2
const DEFENSE_SPEED = 0.5

const BALL_RADIUS = 4
const BALL_SPEED = 120
const BALL_FLASH_DURATION = 0.1

const ASTEROID_MIN_RADIUS = 15
const ASTEROID_MAX_RADIUS = 30
const ASTEROID_MIN_ORBIT = 200
const ASTEROID_MAX_ORBIT = 400
const ASTEROID_MIN_SPEED = 0.01
const ASTEROID_MAX_SPEED = 0.03
const INITIAL_ASTEROIDS = 8
const MAX_ASTEROIDS = 15
const ASTEROID_SPAWN_INTERVAL = 90

const FRAGMENT_MIN_COUNT = 3
const FRAGMENT_MAX_COUNT = 5
const FRAGMENT_MIN_RADIUS = 4
const FRAGMENT_MAX_RADIUS = 7.5
const FRAGMENT_MIN_SPEED = 40
const FRAGMENT_MAX_SPEED = 80
const FRAGMENT_LIFETIME = 1.5

const LOSE_LIFE_RADIUS = 450

interface Vector2 {
  x: number
  y: number
}

interface DefenseRing {
  angle: number
  angularSpeed: number
}

interface EnergyBall {
  position: Vector2
  velocity: Vector2
  active: boolean
  flashTime: number
}

interface Asteroid {
  id: string
  orbitRadius: number
  orbitAngle: number
  orbitSpeed: number
  radius: number
}

interface Fragment {
  id: string
  position: Vector2
  velocity: Vector2
  radius: number
  color: string
  lifetime: number
}

export interface GameCoreCallbacks {
  onScore: (points: number) => void
  onLifeLost: () => void
  onComboHit: () => void
  onAsteroidCountChange: (count: number) => void
  onVictory: () => void
}

export class GameCore {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private callbacks: GameCoreCallbacks

  private defenseRing: DefenseRing
  private energyBall: EnergyBall
  private asteroids: Asteroid[] = []
  private fragments: Fragment[] = []

  private keys = { left: false, right: false }
  private lastTime = 0
  private spawnTimer = 0
  private animationId: number | null = null
  private isRunning = false
  private isGameOver = false

  constructor(canvas: HTMLCanvasElement, callbacks: GameCoreCallbacks) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.callbacks = callbacks

    canvas.width = CANVAS_SIZE
    canvas.height = CANVAS_SIZE

    this.defenseRing = {
      angle: -Math.PI / 2,
      angularSpeed: DEFENSE_SPEED,
    }

    this.energyBall = {
      position: { x: CENTER_X, y: CENTER_Y - DEFENSE_RING_RADIUS },
      velocity: { x: 0, y: 0 },
      active: false,
      flashTime: 0,
    }

    this.spawnInitialAsteroids()
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.lastTime = performance.now()
    this.animationId = requestAnimationFrame(this.gameLoop)
  }

  stop(): void {
    this.isRunning = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  reset(): void {
    this.isGameOver = false
    this.spawnTimer = 0
    this.defenseRing.angle = -Math.PI / 2
    this.asteroids = []
    this.fragments = []
    this.resetBall()
    this.spawnInitialAsteroids()
    this.callbacks.onAsteroidCountChange(this.asteroids.length)
  }

  setGameOver(value: boolean): void {
    this.isGameOver = value
  }

  handleKeyDown(key: string): void {
    if (key === 'ArrowLeft') this.keys.left = true
    if (key === 'ArrowRight') this.keys.right = true
  }

  handleKeyUp(key: string): void {
    if (key === 'ArrowLeft') this.keys.left = false
    if (key === 'ArrowRight') this.keys.right = false
  }

  handleClick(): void {
    if (this.isGameOver) return
    if (!this.energyBall.active) {
      this.launchBall()
    }
  }

  private gameLoop = (timestamp: number): void => {
    if (!this.isRunning) return

    const deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.05)
    this.lastTime = timestamp

    if (!this.isGameOver) {
      this.update(deltaTime)
    }
    this.render()

    this.animationId = requestAnimationFrame(this.gameLoop)
  }

  private update(dt: number): void {
    this.updateDefenseRing(dt)
    this.updateBall(dt)
    this.updateAsteroids(dt)
    this.updateFragments(dt)
    this.checkCollisions()
    this.updateSpawning(dt)
  }

  private updateDefenseRing(dt: number): void {
    if (this.keys.left) {
      this.defenseRing.angle -= this.defenseRing.angularSpeed * dt
    }
    if (this.keys.right) {
      this.defenseRing.angle += this.defenseRing.angularSpeed * dt
    }

    if (!this.energyBall.active) {
      const ringMidAngle = this.defenseRing.angle
      this.energyBall.position.x = CENTER_X + Math.cos(ringMidAngle) * DEFENSE_RING_RADIUS
      this.energyBall.position.y = CENTER_Y + Math.sin(ringMidAngle) * DEFENSE_RING_RADIUS
    }
  }

  private updateBall(dt: number): void {
    if (!this.energyBall.active) return

    if (this.energyBall.flashTime > 0) {
      this.energyBall.flashTime -= dt
    }

    this.energyBall.position.x += this.energyBall.velocity.x * dt
    this.energyBall.position.y += this.energyBall.velocity.y * dt

    const distFromCenter = Math.sqrt(
      this.energyBall.position.x ** 2 + this.energyBall.position.y ** 2
    )

    if (distFromCenter <= PLANET_RADIUS + BALL_RADIUS) {
      this.reflectBallOffPlanet(distFromCenter)
    }

    if (distFromCenter > LOSE_LIFE_RADIUS) {
      this.loseLife()
    }
  }

  private reflectBallOffPlanet(dist: number): void {
    const nx = this.energyBall.position.x / dist
    const ny = this.energyBall.position.y / dist

    const dot = this.energyBall.velocity.x * nx + this.energyBall.velocity.y * ny
    this.energyBall.velocity.x -= 2 * dot * nx
    this.energyBall.velocity.y -= 2 * dot * ny

    const overlap = PLANET_RADIUS + BALL_RADIUS - dist
    this.energyBall.position.x += nx * overlap
    this.energyBall.position.y += ny * overlap
  }

  private updateAsteroids(dt: number): void {
    for (const asteroid of this.asteroids) {
      asteroid.orbitAngle += asteroid.orbitSpeed * dt
    }
  }

  private updateFragments(dt: number): void {
    for (let i = this.fragments.length - 1; i >= 0; i--) {
      const f = this.fragments[i]
      f.position.x += f.velocity.x * dt
      f.position.y += f.velocity.y * dt
      f.lifetime -= dt

      if (f.lifetime <= 0) {
        this.fragments.splice(i, 1)
      }
    }
  }

  private checkCollisions(): void {
    if (!this.energyBall.active) return

    this.checkDefenseRingCollision()
    this.checkAsteroidCollisions()
  }

  private checkDefenseRingCollision(): void {
    const ball = this.energyBall
    const distFromCenter = Math.sqrt(ball.position.x ** 2 + ball.position.y ** 2)

    const ringInner = DEFENSE_RING_RADIUS - 4
    const ringOuter = DEFENSE_RING_RADIUS + 4

    if (distFromCenter < ringInner || distFromCenter > ringOuter) return

    const ballAngle = Math.atan2(ball.position.y, ball.position.x)
    const ringStart = this.defenseRing.angle - DEFENSE_RING_ARC / 2
    const ringEnd = this.defenseRing.angle + DEFENSE_RING_ARC / 2

    let normalizedBallAngle = ballAngle
    while (normalizedBallAngle < ringStart - Math.PI) {
      normalizedBallAngle += Math.PI * 2
    }
    while (normalizedBallAngle > ringEnd + Math.PI) {
      normalizedBallAngle -= Math.PI * 2
    }

    if (normalizedBallAngle >= ringStart && normalizedBallAngle <= ringEnd) {
      this.reflectBallOffDefenseRing(distFromCenter, normalizedBallAngle)
    }
  }

  private reflectBallOffDefenseRing(dist: number, angle: number): void {
    const nx = Math.cos(angle)
    const ny = Math.sin(angle)

    const ball = this.energyBall
    const dot = ball.velocity.x * nx + ball.velocity.y * ny

    if ((dist < DEFENSE_RING_RADIUS && dot < 0) || (dist > DEFENSE_RING_RADIUS && dot > 0)) {
      return
    }

    ball.velocity.x -= 2 * dot * nx
    ball.velocity.y -= 2 * dot * ny

    const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2)
    if (speed > 0) {
      ball.velocity.x = (ball.velocity.x / speed) * BALL_SPEED
      ball.velocity.y = (ball.velocity.y / speed) * BALL_SPEED
    }

    if (dist < DEFENSE_RING_RADIUS) {
      const overlap = DEFENSE_RING_RADIUS + BALL_RADIUS - dist
      ball.position.x -= nx * overlap
      ball.position.y -= ny * overlap
    } else {
      const overlap = dist - (DEFENSE_RING_RADIUS - BALL_RADIUS)
      ball.position.x += nx * overlap
      ball.position.y += ny * overlap
    }
  }

  private checkAsteroidCollisions(): void {
    const ball = this.energyBall

    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const asteroid = this.asteroids[i]
      const ax = CENTER_X + Math.cos(asteroid.orbitAngle) * asteroid.orbitRadius
      const ay = CENTER_Y + Math.sin(asteroid.orbitAngle) * asteroid.orbitRadius

      const dx = ball.position.x - ax
      const dy = ball.position.y - ay
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < asteroid.radius + BALL_RADIUS) {
        this.onAsteroidHit(asteroid, i, ax, ay, dx, dy, dist)
        break
      }
    }
  }

  private onAsteroidHit(
    asteroid: Asteroid,
    index: number,
    ax: number,
    ay: number,
    dx: number,
    dy: number,
    dist: number
  ): void {
    const nx = dx / dist
    const ny = dy / dist

    const dot = this.energyBall.velocity.x * nx + this.energyBall.velocity.y * ny
    this.energyBall.velocity.x -= 2 * dot * nx
    this.energyBall.velocity.y -= 2 * dot * ny

    const speed = Math.sqrt(
      this.energyBall.velocity.x ** 2 + this.energyBall.velocity.y ** 2
    )
    if (speed > 0) {
      this.energyBall.velocity.x = (this.energyBall.velocity.x / speed) * BALL_SPEED
      this.energyBall.velocity.y = (this.energyBall.velocity.y / speed) * BALL_SPEED
    }

    const overlap = asteroid.radius + BALL_RADIUS - dist
    this.energyBall.position.x += nx * overlap
    this.energyBall.position.y += ny * overlap

    this.spawnFragments(ax, ay, asteroid.radius)

    this.asteroids.splice(index, 1)
    this.callbacks.onAsteroidCountChange(this.asteroids.length)
    this.callbacks.onScore(10)
    this.callbacks.onComboHit()

    if (this.asteroids.length === 0 && this.fragments.length === 0) {
      this.callbacks.onVictory()
    }
  }

  private spawnFragments(x: number, y: number, asteroidRadius: number): void {
    const count = Math.floor(
      Math.random() * (FRAGMENT_MAX_COUNT - FRAGMENT_MIN_COUNT + 1) + FRAGMENT_MIN_COUNT
    )

    const colors = ['#DC2626', '#EA580C', '#F59E0B', '#FBBF24', '#EF4444']

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
      const speed =
        Math.random() * (FRAGMENT_MAX_SPEED - FRAGMENT_MIN_SPEED) + FRAGMENT_MIN_SPEED
      const radius =
        Math.random() * (FRAGMENT_MAX_RADIUS - FRAGMENT_MIN_RADIUS) + FRAGMENT_MIN_RADIUS

      this.fragments.push({
        id: uuidv4(),
        position: { x, y },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        radius,
        color: colors[Math.floor(Math.random() * colors.length)],
        lifetime: FRAGMENT_LIFETIME,
      })
    }
  }

  private updateSpawning(dt: number): void {
    this.spawnTimer += dt

    if (this.spawnTimer >= ASTEROID_SPAWN_INTERVAL) {
      this.spawnTimer = 0
      this.spawnAsteroidBatch()
    }
  }

  private spawnAsteroidBatch(): void {
    const toSpawn = Math.min(8, MAX_ASTEROIDS - this.asteroids.length)
    for (let i = 0; i < toSpawn; i++) {
      this.spawnAsteroid()
    }
    this.callbacks.onAsteroidCountChange(this.asteroids.length)
  }

  private spawnInitialAsteroids(): void {
    for (let i = 0; i < INITIAL_ASTEROIDS; i++) {
      this.spawnAsteroid()
    }
    this.callbacks.onAsteroidCountChange(this.asteroids.length)
  }

  private spawnAsteroid(): void {
    const orbitRadius =
      Math.random() * (ASTEROID_MAX_ORBIT - ASTEROID_MIN_ORBIT) + ASTEROID_MIN_ORBIT
    const radius =
      Math.random() * (ASTEROID_MAX_RADIUS - ASTEROID_MIN_RADIUS) + ASTEROID_MIN_RADIUS
    const orbitAngle = Math.random() * Math.PI * 2
    const orbitSpeed =
      (Math.random() * (ASTEROID_MAX_SPEED - ASTEROID_MIN_SPEED) + ASTEROID_MIN_SPEED) *
      (Math.random() > 0.5 ? 1 : -1)

    this.asteroids.push({
      id: uuidv4(),
      orbitRadius,
      orbitAngle,
      orbitSpeed,
      radius,
    })
  }

  private launchBall(): void {
    const angle = this.defenseRing.angle
    const tangentAngle = angle + Math.PI / 2

    this.energyBall.velocity = {
      x: Math.cos(tangentAngle) * BALL_SPEED,
      y: Math.sin(tangentAngle) * BALL_SPEED,
    }
    this.energyBall.active = true
    this.energyBall.flashTime = BALL_FLASH_DURATION
  }

  private loseLife(): void {
    this.callbacks.onLifeLost()
    this.resetBall()
  }

  private resetBall(): void {
    this.energyBall.active = false
    this.energyBall.flashTime = 0
    const ringMidAngle = this.defenseRing.angle
    this.energyBall.position.x = CENTER_X + Math.cos(ringMidAngle) * DEFENSE_RING_RADIUS
    this.energyBall.position.y = CENTER_Y + Math.sin(ringMidAngle) * DEFENSE_RING_RADIUS
    this.energyBall.velocity = { x: 0, y: 0 }
  }

  private render(): void {
    const ctx = this.ctx

    ctx.fillStyle = '#0B0E14'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    this.drawPlanet()
    this.drawOrbits()
    this.drawAsteroids()
    this.drawFragments()
    this.drawDefenseRing()
    this.drawEnergyBall()
  }

  private drawPlanet(): void {
    const ctx = this.ctx

    const glowGradient = ctx.createRadialGradient(
      CENTER_X,
      CENTER_Y,
      PLANET_RADIUS,
      CENTER_X,
      CENTER_Y,
      PLANET_RADIUS + 60
    )
    glowGradient.addColorStop(0, 'rgba(100, 116, 255, 0.3)')
    glowGradient.addColorStop(1, 'rgba(100, 116, 255, 0)')
    ctx.fillStyle = glowGradient
    ctx.beginPath()
    ctx.arc(CENTER_X, CENTER_Y, PLANET_RADIUS + 60, 0, Math.PI * 2)
    ctx.fill()

    const planetGradient = ctx.createRadialGradient(
      CENTER_X - 20,
      CENTER_Y - 20,
      10,
      CENTER_X,
      CENTER_Y,
      PLANET_RADIUS
    )
    planetGradient.addColorStop(0, '#805AD5')
    planetGradient.addColorStop(1, '#4C51BF')
    ctx.fillStyle = planetGradient
    ctx.beginPath()
    ctx.arc(CENTER_X, CENTER_Y, PLANET_RADIUS, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawOrbits(): void {
    const ctx = this.ctx
    ctx.strokeStyle = '#6366F180'
    ctx.lineWidth = 2

    for (const radius of ORBIT_RADII) {
      ctx.beginPath()
      ctx.arc(CENTER_X, CENTER_Y, radius, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  private drawDefenseRing(): void {
    const ctx = this.ctx
    const startAngle = this.defenseRing.angle - DEFENSE_RING_ARC / 2
    const endAngle = this.defenseRing.angle + DEFENSE_RING_ARC / 2

    ctx.save()
    ctx.shadowColor = '#FFFFFF40'
    ctx.shadowBlur = 12
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'

    ctx.beginPath()
    ctx.arc(CENTER_X, CENTER_Y, DEFENSE_RING_RADIUS, startAngle, endAngle)
    ctx.stroke()
    ctx.restore()
  }

  private drawEnergyBall(): void {
    const ctx = this.ctx
    const ball = this.energyBall

    if (ball.flashTime > 0) {
      const alpha = ball.flashTime / BALL_FLASH_DURATION
      ctx.save()
      ctx.shadowColor = '#FFFFFF'
      ctx.shadowBlur = 30 * alpha
      ctx.fillStyle = `rgba(255, 255, 255, ${1})`
      ctx.beginPath()
      ctx.arc(ball.position.x, ball.position.y, BALL_RADIUS + 4 * alpha, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    } else {
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(ball.position.x, ball.position.y, BALL_RADIUS, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private drawAsteroids(): void {
    const ctx = this.ctx

    for (const asteroid of this.asteroids) {
      const x = CENTER_X + Math.cos(asteroid.orbitAngle) * asteroid.orbitRadius
      const y = CENTER_Y + Math.sin(asteroid.orbitAngle) * asteroid.orbitRadius

      const gradient = ctx.createRadialGradient(
        x - asteroid.radius * 0.3,
        y - asteroid.radius * 0.3,
        asteroid.radius * 0.2,
        x,
        y,
        asteroid.radius
      )
      gradient.addColorStop(0, '#F59E0B')
      gradient.addColorStop(1, '#DC2626')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, asteroid.radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private drawFragments(): void {
    const ctx = this.ctx

    for (const fragment of this.fragments) {
      const alpha = fragment.lifetime / FRAGMENT_LIFETIME
      ctx.globalAlpha = alpha
      ctx.fillStyle = fragment.color
      ctx.beginPath()
      ctx.arc(fragment.position.x, fragment.position.y, fragment.radius, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
}
