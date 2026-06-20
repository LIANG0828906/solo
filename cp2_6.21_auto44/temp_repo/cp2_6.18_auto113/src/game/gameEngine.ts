import { v4 as uuidv4 } from 'uuid'

export interface Vector2 {
  x: number
  y: number
}

export interface SonicRay {
  x: number
  y: number
  dirX: number
  dirY: number
  distance: number
  reflections: number
  active: boolean
}

export interface SonicPulse {
  id: string
  rays: SonicRay[]
  originX: number
  originY: number
  maxReflections: number
  maxDistance: number
  createdAt: number
  energy: number
}

export interface Target {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  visible: boolean
  visibleTimer: number
  directionTimer: number
  speed: number
  alive: boolean
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
  maxLife: number
  size: number
  active: boolean
}

export interface RadarPoint {
  x: number
  y: number
  alpha: number
  age: number
}

export interface RippleEffect {
  x: number
  y: number
  radius: number
  maxRadius: number
  alpha: number
  active: boolean
}

export interface GameStateSnapshot {
  score: number
  timeLeft: number
  level: number
  isPlaying: boolean
  isGameOver: boolean
  targetsNeeded: number
  currentLevelHits: number
}

const ARENA_RADIUS = 400
const PLAYER_RADIUS = 8
const SONIC_SPEED = 200
const TARGET_RADIUS = 12
const TARGET_SPEED_MIN = 0.5
const TARGET_SPEED_MAX = 2
const TARGET_DIRECTION_CHANGE_INTERVAL = 3
const TARGET_VISIBLE_DURATION = 2
const INITIAL_TARGETS = 5
const CHARGE_MIN = 0.5
const CHARGE_MAX = 2
const PARTICLE_COUNT = 30
const PARTICLE_LIFETIME = 0.6
const RADAR_POINT_LIFETIME = 0.5
const RIPPLE_MAX_RADIUS = 30
const RIPPLE_DURATION = 0.3
const LEVEL_DURATION = 60
const SCORE_PER_HIT = 50
const RAY_COUNT = 120
const BASE_TARGETS_PER_LEVEL = 5
const TARGETS_INCREMENT_PER_LEVEL = 2

type GameStateCallback = (state: GameStateSnapshot) => void
type ScoreCallback = (points: number) => void

export class GameEngine {
  public width: number = 0
  public height: number = 0
  public arenaCenter: Vector2 = { x: 0, y: 0 }
  public arenaRadius: number = ARENA_RADIUS

  public playerPos: Vector2 = { x: 0, y: 0 }
  public playerRadius: number = PLAYER_RADIUS

  public pulses: SonicPulse[] = []
  public targets: Target[] = []
  public particles: Particle[] = []
  private particlePool: Particle[] = []

  public radarPoints: RadarPoint[] = []
  public ripple: RippleEffect = {
    x: 0, y: 0, radius: 0, maxRadius: RIPPLE_MAX_RADIUS, alpha: 0, active: false
  }

  private isCharging: boolean = false
  private chargeStartTime: number = 0
  private chargeDirection: Vector2 = { x: 1, y: 0 }
  private mousePos: Vector2 = { x: 0, y: 0 }

  private score: number = 0
  private timeLeft: number = LEVEL_DURATION
  private level: number = 1
  private isPlaying: boolean = false
  private isGameOver: boolean = false
  private targetsNeeded: number = BASE_TARGETS_PER_LEVEL
  private currentLevelHits: number = 0

  private lastTime: number = 0
  private animationFrameId: number | null = null

  private onStateChange: GameStateCallback | null = null
  private onScore: ScoreCallback | null = null
  private onLevelComplete: (() => void) | null = null
  private onGameOver: (() => void) | null = null

  constructor() {
    this.initParticlePool()
  }

  public setCanvasSize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.arenaCenter = { x: width / 2, y: height / 2 - 40 }
    this.playerPos = { ...this.arenaCenter }
  }

  public setStateChangeCallback(callback: GameStateCallback): void {
    this.onStateChange = callback
  }

  public setScoreCallback(callback: ScoreCallback): void {
    this.onScore = callback
  }

  public setLevelCompleteCallback(callback: () => void): void {
    this.onLevelComplete = callback
  }

  public setGameOverCallback(callback: () => void): void {
    this.onGameOver = callback
  }

  public start(): void {
    if (this.isPlaying) return
    this.isPlaying = true
    this.isGameOver = false
    this.score = 0
    this.timeLeft = LEVEL_DURATION
    this.level = 1
    this.targetsNeeded = BASE_TARGETS_PER_LEVEL
    this.currentLevelHits = 0
    this.pulses = []
    this.particles = []
    this.radarPoints = []
    this.targets = []
    this.initTargets()
    this.lastTime = performance.now()
    this.notifyStateChange()
    this.gameLoop()
  }

  public stop(): void {
    this.isPlaying = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  public reset(): void {
    this.stop()
    this.score = 0
    this.timeLeft = LEVEL_DURATION
    this.level = 1
    this.targetsNeeded = BASE_TARGETS_PER_LEVEL
    this.currentLevelHits = 0
    this.isGameOver = false
    this.pulses = []
    this.targets = []
    this.particles.forEach(p => p.active = false)
    this.radarPoints = []
    this.initTargets()
  }

  private initTargets(): void {
    const speedMultiplier = 1 + (this.level - 1) * 0.1
    for (let i = 0; i < INITIAL_TARGETS; i++) {
      this.targets.push(this.createTarget(speedMultiplier))
    }
  }

  private createTarget(speedMultiplier: number = 1): Target {
    const angle = Math.random() * Math.PI * 2
    const dist = Math.random() * (this.arenaRadius - TARGET_RADIUS - 20) + 20
    const speed = (TARGET_SPEED_MIN + Math.random() * (TARGET_SPEED_MAX - TARGET_SPEED_MIN)) * speedMultiplier
    const dirAngle = Math.random() * Math.PI * 2

    return {
      id: uuidv4(),
      x: this.arenaCenter.x + Math.cos(angle) * dist,
      y: this.arenaCenter.y + Math.sin(angle) * dist,
      vx: Math.cos(dirAngle) * speed,
      vy: Math.sin(dirAngle) * speed,
      radius: TARGET_RADIUS,
      visible: false,
      visibleTimer: 0,
      directionTimer: Math.random() * TARGET_DIRECTION_CHANGE_INTERVAL,
      speed: speed,
      alive: true
    }
  }

  private initParticlePool(): void {
    const poolSize = 200
    for (let i = 0; i < poolSize; i++) {
      this.particlePool.push({
        x: 0, y: 0, vx: 0, vy: 0, color: '#fff',
        life: 0, maxLife: 1, size: 2, active: false
      })
    }
  }

  private getParticleFromPool(): Particle | null {
    const particle = this.particlePool.find(p => !p.active)
    if (particle) {
      particle.active = true
      return particle
    }
    return null
  }

  public handleMouseDown(x: number, y: number): void {
    if (!this.isPlaying || this.isGameOver) return
    this.isCharging = true
    this.chargeStartTime = performance.now() / 1000
    this.mousePos = { x, y }
    this.updateChargeDirection()
  }

  public handleMouseMove(x: number, y: number): void {
    this.mousePos = { x, y }
    if (this.isCharging) {
      this.updateChargeDirection()
    }
  }

  public handleMouseUp(x: number, y: number): void {
    if (!this.isPlaying || this.isGameOver || !this.isCharging) return
    this.isCharging = false
    this.mousePos = { x, y }
    this.firePulse()
  }

  private updateChargeDirection(): void {
    const dx = this.mousePos.x - this.playerPos.x
    const dy = this.mousePos.y - this.playerPos.y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len > 0) {
      this.chargeDirection = { x: dx / len, y: dy / len }
    }
  }

  private getChargeTime(): number {
    if (!this.isCharging) return 0
    const now = performance.now() / 1000
    return Math.min(Math.max(now - this.chargeStartTime, 0), CHARGE_MAX)
  }

  public getChargeProgress(): number {
    const chargeTime = this.getChargeTime()
    if (chargeTime < CHARGE_MIN) return chargeTime / CHARGE_MIN * 0.5
    return 0.5 + (chargeTime - CHARGE_MIN) / (CHARGE_MAX - CHARGE_MIN) * 0.5
  }

  public isChargeReady(): boolean {
    return this.getChargeTime() >= CHARGE_MIN
  }

  private firePulse(): void {
    const chargeTime = this.getChargeTime()
    if (chargeTime < CHARGE_MIN) return

    const normalizedCharge = (chargeTime - CHARGE_MIN) / (CHARGE_MAX - CHARGE_MIN)
    const angleSpread = (Math.PI / 6) + normalizedCharge * (Math.PI * 2 - Math.PI / 6)
    const maxReflections = Math.floor(5 - normalizedCharge * 3) + 1
    const energy = 1 - normalizedCharge * 0.5

    const rays: SonicRay[] = []
    const baseAngle = Math.atan2(this.chargeDirection.y, this.chargeDirection.x)
    const startAngle = baseAngle - angleSpread / 2
    const angleStep = angleSpread / (RAY_COUNT - 1)

    for (let i = 0; i < RAY_COUNT; i++) {
      const angle = startAngle + angleStep * i
      rays.push({
        x: this.playerPos.x,
        y: this.playerPos.y,
        dirX: Math.cos(angle),
        dirY: Math.sin(angle),
        distance: 0,
        reflections: 0,
        active: true
      })
    }

    const pulse: SonicPulse = {
      id: uuidv4(),
      rays,
      originX: this.playerPos.x,
      originY: this.playerPos.y,
      maxReflections,
      maxDistance: 2000,
      createdAt: performance.now() / 1000,
      energy
    }

    this.pulses.push(pulse)

    this.ripple = {
      x: this.mousePos.x,
      y: this.mousePos.y,
      radius: 5,
      maxRadius: RIPPLE_MAX_RADIUS,
      alpha: 0.8,
      active: true
    }
  }

  private gameLoop = (): void => {
    if (!this.isPlaying) return

    const now = performance.now()
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.05)
    this.lastTime = now

    this.update(deltaTime)

    this.animationFrameId = requestAnimationFrame(this.gameLoop)
  }

  private update(dt: number): void {
    if (!this.isPlaying || this.isGameOver) return

    this.timeLeft -= dt
    if (this.timeLeft <= 0) {
      this.timeLeft = 0
      if (this.currentLevelHits >= this.targetsNeeded) {
        this.nextLevel()
      } else {
        this.gameOver()
      }
      return
    }

    this.updatePulses(dt)
    this.updateTargets(dt)
    this.updateParticles(dt)
    this.updateRadar(dt)
    this.updateRipple(dt)

    this.notifyStateChange()
  }

  private nextLevel(): void {
    this.level++
    this.timeLeft = LEVEL_DURATION
    this.targetsNeeded = BASE_TARGETS_PER_LEVEL + (this.level - 1) * TARGETS_INCREMENT_PER_LEVEL
    this.currentLevelHits = 0
    this.pulses = []
    this.targets = []
    this.initTargets()
    if (this.onLevelComplete) {
      this.onLevelComplete()
    }
  }

  private updatePulses(dt: number): void {
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const pulse = this.pulses[i]
      let allRaysDead = true

      for (const ray of pulse.rays) {
        if (!ray.active) continue

        const moveDist = SONIC_SPEED * dt
        ray.distance += moveDist

        let remainingDist = moveDist

        while (remainingDist > 0 && ray.active && ray.reflections <= pulse.maxReflections) {
          const dx = this.arenaCenter.x - ray.x
          const dy = this.arenaCenter.y - ray.y
          const distToCenter = Math.sqrt(dx * dx + dy * dy)

          const a = 1
          const b = 2 * (ray.dirX * (ray.x - this.arenaCenter.x) + ray.dirY * (ray.y - this.arenaCenter.y))
          const c = distToCenter * distToCenter - this.arenaRadius * this.arenaRadius
          const discriminant = b * b - 4 * a * c

          let hitWallDist = Infinity
          if (discriminant >= 0) {
            const t1 = (-b - Math.sqrt(discriminant)) / (2 * a)
            const t2 = (-b + Math.sqrt(discriminant)) / (2 * a)
            if (t1 > 0.001) hitWallDist = Math.min(hitWallDist, t1)
            if (t2 > 0.001) hitWallDist = Math.min(hitWallDist, t2)
          }

          if (hitWallDist <= remainingDist && hitWallDist > 0.001) {
            ray.x += ray.dirX * hitWallDist
            ray.y += ray.dirY * hitWallDist
            remainingDist -= hitWallDist

            const nx = (ray.x - this.arenaCenter.x) / this.arenaRadius
            const ny = (ray.y - this.arenaCenter.y) / this.arenaRadius

            const dot = ray.dirX * nx + ray.dirY * ny
            ray.dirX = ray.dirX - 2 * dot * nx
            ray.dirY = ray.dirY - 2 * dot * ny

            ray.reflections++

            if (ray.reflections > pulse.maxReflections) {
              ray.active = false
            }
          } else {
            ray.x += ray.dirX * remainingDist
            ray.y += ray.dirY * remainingDist
            remainingDist = 0
          }
        }

        if (ray.active) {
          allRaysDead = false

          this.radarPoints.push({
            x: ray.x,
            y: ray.y,
            alpha: 0.6 * pulse.energy,
            age: 0
          })

          for (const target of this.targets) {
            if (!target.alive) continue
            const tdx = ray.x - target.x
            const tdy = ray.y - target.y
            const dist = Math.sqrt(tdx * tdx + tdy * tdy)
            if (dist < target.radius + 3) {
              this.hitTarget(target)
              ray.active = false
              break
            }
          }
        }
      }

      if (allRaysDead) {
        this.pulses.splice(i, 1)
      }
    }

    if (this.radarPoints.length > 500) {
      this.radarPoints = this.radarPoints.slice(-500)
    }
  }

  private hitTarget(target: Target): void {
    target.visible = true
    target.visibleTimer = TARGET_VISIBLE_DURATION
    target.alive = false

    this.spawnExplosion(target.x, target.y)

    this.score += SCORE_PER_HIT
    this.currentLevelHits++
    if (this.onScore) {
      this.onScore(SCORE_PER_HIT)
    }

    setTimeout(() => {
      const index = this.targets.indexOf(target)
      if (index > -1) {
        this.targets.splice(index, 1)
        const speedMultiplier = 1 + (this.level - 1) * 0.1
        this.targets.push(this.createTarget(speedMultiplier))
      }
    }, TARGET_VISIBLE_DURATION * 1000)
  }

  private spawnExplosion(x: number, y: number): void {
    const colors = ['#FFD700', '#FF8C00', '#FF6347', '#FF4500', '#FFFF00', '#FFA500']

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const particle = this.getParticleFromPool()
      if (!particle) break

      const angle = Math.random() * Math.PI * 2
      const speed = 50 + Math.random() * 150

      particle.x = x
      particle.y = y
      particle.vx = Math.cos(angle) * speed
      particle.vy = Math.sin(angle) * speed
      particle.color = colors[Math.floor(Math.random() * colors.length)]
      particle.life = PARTICLE_LIFETIME
      particle.maxLife = PARTICLE_LIFETIME
      particle.size = 2 + Math.random() * 4
      particle.active = true

      this.particles.push(particle)
    }
  }

  private updateTargets(dt: number): void {
    for (const target of this.targets) {
      if (!target.alive && target.visibleTimer <= 0) continue

      target.x += target.vx * dt
      target.y += target.vy * dt

      const dx = target.x - this.arenaCenter.x
      const dy = target.y - this.arenaCenter.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist + target.radius > this.arenaRadius) {
        const nx = dx / dist
        const ny = dy / dist
        const dot = target.vx * nx + target.vy * ny
        target.vx = target.vx - 2 * dot * nx
        target.vy = target.vy - 2 * dot * ny

        const overlap = dist + target.radius - this.arenaRadius
        target.x -= nx * overlap
        target.y -= ny * overlap
      }

      target.directionTimer -= dt
      if (target.directionTimer <= 0) {
        target.directionTimer = TARGET_DIRECTION_CHANGE_INTERVAL
        const angle = Math.random() * Math.PI * 2
        target.vx = Math.cos(angle) * target.speed
        target.vy = Math.sin(angle) * target.speed
      }

      if (target.visibleTimer > 0) {
        target.visibleTimer -= dt
        if (target.visibleTimer <= 0) {
          target.visible = false
        }
      }
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      if (!p.active) {
        this.particles.splice(i, 1)
        continue
      }

      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vx *= 0.98
      p.vy *= 0.98
      p.life -= dt

      if (p.life <= 0) {
        p.active = false
        this.particles.splice(i, 1)
      }
    }
  }

  private updateRadar(dt: number): void {
    for (let i = this.radarPoints.length - 1; i >= 0; i--) {
      const point = this.radarPoints[i]
      point.age += dt
      point.alpha = Math.max(0, 0.6 * (1 - point.age / RADAR_POINT_LIFETIME))
      if (point.age >= RADAR_POINT_LIFETIME) {
        this.radarPoints.splice(i, 1)
      }
    }
  }

  private updateRipple(dt: number): void {
    if (!this.ripple.active) return

    this.ripple.radius += (this.ripple.maxRadius - 5) / RIPPLE_DURATION * dt
    this.ripple.alpha = 0.8 * (1 - this.ripple.radius / this.ripple.maxRadius)

    if (this.ripple.radius >= this.ripple.maxRadius) {
      this.ripple.active = false
    }
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange({
        score: this.score,
        timeLeft: this.timeLeft,
        level: this.level,
        isPlaying: this.isPlaying,
        isGameOver: this.isGameOver,
        targetsNeeded: this.targetsNeeded,
        currentLevelHits: this.currentLevelHits
      })
    }
  }

  public getState(): GameStateSnapshot {
    return {
      score: this.score,
      timeLeft: this.timeLeft,
      level: this.level,
      isPlaying: this.isPlaying,
      isGameOver: this.isGameOver,
      targetsNeeded: this.targetsNeeded,
      currentLevelHits: this.currentLevelHits
    }
  }

  public getChargeDirection(): Vector2 {
    return this.chargeDirection
  }

  public getMousePos(): Vector2 {
    return this.mousePos
  }

  public gameOver(): void {
    this.isGameOver = true
    this.isPlaying = false
    if (this.onGameOver) {
      this.onGameOver()
    }
    this.notifyStateChange()
  }
}
