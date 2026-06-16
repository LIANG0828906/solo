import type {
  CarState,
  Particle,
  Track,
  TrackWaypoint,
  InputState,
  EngineConfig,
  Vec2,
} from '../types'
import { DEFAULT_ENGINE_CONFIG } from '../types'

function generateTrack(): Track {
  const worldSize = 2000
  const centerX = worldSize / 2
  const centerY = worldSize / 2
  const baseRadius = 600
  const waypoints: TrackWaypoint[] = []
  const numWaypoints = 24

  for (let i = 0; i < numWaypoints; i++) {
    const angle = (i / numWaypoints) * Math.PI * 2
    const wobble = Math.sin(angle * 3) * 80 + Math.sin(angle * 5) * 40
    const radius = baseRadius + wobble
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    waypoints.push({ x, y, width: 120 })
  }

  return {
    waypoints,
    width: 120,
    worldSize,
  }
}

function createInitialCarState(track: Track): CarState {
  const startWp = track.waypoints[0]
  const nextWp = track.waypoints[1]
  const angle = Math.atan2(nextWp.y - startWp.y, nextWp.x - startWp.x)

  return {
    position: { x: startWp.x, y: startWp.y },
    velocity: { x: 0, y: 0 },
    angle,
    angularVelocity: 0,
    speed: 0,
    steerAngle: 0,
    isDrifting: false,
    driftTime: 0,
    nitroEnergy: 0,
    nitroActive: false,
    nitroTime: 0,
  }
}

class ParticlePool {
  private pool: Particle[] = []
  private nextId = 0
  private maxParticles: number
  private activeCount = 0

  constructor(maxParticles: number) {
    this.maxParticles = maxParticles
  }

  public getParticleCount(): number {
    return this.activeCount
  }

  emit(
    position: Vec2,
    velocity: Vec2,
    life: number,
    size: number,
    color: string,
    type: 'drift' | 'nitro'
  ): boolean {
    if (this.activeCount >= this.maxParticles) return false

    const deadParticle = this.pool.find((p) => p.life <= 0)
    if (deadParticle) {
      deadParticle.position.x = position.x
      deadParticle.position.y = position.y
      deadParticle.velocity.x = velocity.x
      deadParticle.velocity.y = velocity.y
      deadParticle.life = life
      deadParticle.maxLife = life
      deadParticle.size = size
      deadParticle.color = color
      deadParticle.type = type
      this.activeCount++
      return true
    }

    if (this.pool.length >= this.maxParticles) return false

    this.pool.push({
      id: this.nextId++,
      position: { ...position },
      velocity: { ...velocity },
      life,
      maxLife: life,
      size,
      color,
      type,
    })
    this.activeCount++
    return true
  }

  update(dt: number): void {
    let count = 0
    for (const p of this.pool) {
      if (p.life <= 0) continue
      p.life -= dt
      if (p.life <= 0) {
        p.life = 0
        continue
      }
      p.position.x += p.velocity.x * dt
      p.position.y += p.velocity.y * dt
      p.velocity.x *= 0.97
      p.velocity.y *= 0.97
      count++
    }
    this.activeCount = count
  }

  getActiveParticles(): Particle[] {
    return this.pool.filter((p) => p.life > 0)
  }
}

export class GameEngine {
  public car: CarState
  public track: Track
  public particles: ParticlePool
  public config: EngineConfig
  public currentWaypointIndex = 0
  public lap = 0
  public lapTime = 0
  public driftScore = 0
  public nitroUses = 0
  public bestLapTime: number | null = null
  public lastLapTime = 0
  public lastLapDriftScore = 0
  public lastLapNitroUses = 0
  private lastWaypointIndex = -1
  private lapStartTime = 0
  private lapJustCompleted = false

  constructor(config?: Partial<EngineConfig>) {
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config }
    this.track = generateTrack()
    this.car = createInitialCarState(this.track)
    this.particles = new ParticlePool(this.config.maxParticles)
    this.lapStartTime = performance.now() / 1000
  }

  public reset(): void {
    this.car = createInitialCarState(this.track)
    this.currentWaypointIndex = 0
    this.lastWaypointIndex = -1
    this.lap = 0
    this.lapTime = 0
    this.driftScore = 0
    this.nitroUses = 0
    this.lapStartTime = performance.now() / 1000
  }

  public update(dt: number, input: InputState): void {
    dt = Math.min(dt, 0.05)

    this.lapTime += dt

    this.updateCarPhysics(dt, input)
    this.checkTrackCollision()
    this.checkWaypoints()
    this.particles.update(dt)
  }

  private updateCarPhysics(dt: number, input: InputState): void {
    const car = this.car
    const cfg = this.config

    let targetSteer = 0
    if (input.left) targetSteer -= cfg.maxSteerAngle
    if (input.right) targetSteer += cfg.maxSteerAngle

    car.steerAngle += (targetSteer - car.steerAngle) * 8 * dt

    const isDrifting = input.space && Math.abs(car.steerAngle) > 0.1 && car.speed > 50

    if (isDrifting && !car.isDrifting) {
      car.isDrifting = true
      car.driftTime = 0
    } else if (!isDrifting && car.isDrifting) {
      if (car.nitroEnergy >= 100) {
        car.nitroActive = true
        car.nitroTime = cfg.nitroDuration
        this.nitroUses++
      }
      car.isDrifting = false
      car.driftTime = 0
    }

    if (car.isDrifting) {
      car.driftTime += dt
      this.driftScore += cfg.pointsPerDriftSecond * dt
      car.nitroEnergy = Math.min(100, car.nitroEnergy + cfg.nitroFillRate * dt)
      this.emitDriftParticles(dt)
    }

    if (car.nitroActive) {
      car.nitroTime -= dt
      if (car.nitroTime <= 0) {
        car.nitroActive = false
        car.nitroEnergy = 0
      } else {
        this.emitNitroParticles(dt)
      }
    }

    const speedMultiplier = car.nitroActive ? cfg.nitroBoostMultiplier : 1
    const currentMaxSpeed = cfg.maxSpeed * speedMultiplier

    if (input.up) {
      car.speed = Math.min(car.speed + cfg.acceleration * dt, currentMaxSpeed)
    }
    if (input.down) {
      car.speed = Math.max(car.speed - cfg.acceleration * dt * 0.8, -currentMaxSpeed * 0.3)
    }

    car.speed *= 1 - cfg.friction * dt

    const driftFactor = car.isDrifting ? 0.6 : 1
    const turnRate = cfg.steerSpeed * (Math.abs(car.speed) / cfg.maxSpeed) * driftFactor

    car.angle += car.steerAngle * turnRate * Math.sign(car.speed || 1) * dt

    car.velocity.x = Math.cos(car.angle) * car.speed
    car.velocity.y = Math.sin(car.angle) * car.speed

    if (car.isDrifting) {
      const slideAngle = car.steerAngle * 0.5
      const slideSpeed = car.speed * 0.3
      car.velocity.x += Math.cos(car.angle + Math.PI / 2) * slideSpeed * Math.sign(car.steerAngle)
      car.velocity.y += Math.sin(car.angle + Math.PI / 2) * slideSpeed * Math.sign(car.steerAngle)
    }

    car.position.x += car.velocity.x * dt
    car.position.y += car.velocity.y * dt
  }

  private emitDriftParticles(dt: number): void {
    const car = this.car
    const emitRate = 20 + car.driftTime * 15
    const count = Math.floor(emitRate * dt)

    const driftProgress = Math.min(1, car.driftTime / 3)
    const r = Math.floor(59 + driftProgress * 147)
    const g = Math.floor(130 - driftProgress * 80)
    const b = Math.floor(246 - driftProgress * 100)
    const color = `rgb(${r}, ${g}, ${b})`

    const rearX = car.position.x - Math.cos(car.angle) * 20
    const rearY = car.position.y - Math.sin(car.angle) * 20

    for (let i = 0; i < count; i++) {
      const sideOffset = (Math.random() - 0.5) * 30
      const perpX = -Math.sin(car.angle) * sideOffset
      const perpY = Math.cos(car.angle) * sideOffset

      const speed = 20 + Math.random() * 30
      const angle = car.angle + Math.PI + (Math.random() - 0.5) * 0.5

      this.particles.emit(
        { x: rearX + perpX, y: rearY + perpY },
        { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        0.5 + Math.random() * 0.5,
        3 + Math.random() * 4,
        color,
        'drift'
      )
    }
  }

  private emitNitroParticles(dt: number): void {
    const car = this.car
    const emitRate = 80
    const count = Math.floor(emitRate * dt)

    const rearX = car.position.x - Math.cos(car.angle) * 28
    const rearY = car.position.y - Math.sin(car.angle) * 28

    for (let i = 0; i < count; i++) {
      const sideOffset = (Math.random() - 0.5) * 18
      const perpX = -Math.sin(car.angle) * sideOffset
      const perpY = Math.cos(car.angle) * sideOffset

      const speed = 120 + Math.random() * 100
      const spread = (Math.random() - 0.5) * 0.4
      const angle = car.angle + Math.PI + spread

      const rand = Math.random()
      let color: string
      if (rand < 0.3) {
        color = '#fef08a'
      } else if (rand < 0.6) {
        color = '#f97316'
      } else if (rand < 0.85) {
        color = '#ea580c'
      } else {
        color = '#dc2626'
      }

      this.particles.emit(
        { x: rearX + perpX, y: rearY + perpY },
        { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        0.25 + Math.random() * 0.35,
        5 + Math.random() * 8,
        color,
        'nitro'
      )
    }

    for (let i = 0; i < Math.floor(count * 0.3); i++) {
      const sideOffset = (Math.random() - 0.5) * 12
      const perpX = -Math.sin(car.angle) * sideOffset
      const perpY = Math.cos(car.angle) * sideOffset

      const speed = 60 + Math.random() * 40
      const angle = car.angle + Math.PI + (Math.random() - 0.5) * 0.2

      this.particles.emit(
        { x: rearX - Math.cos(car.angle) * 10 + perpX, y: rearY - Math.sin(car.angle) * 10 + perpY },
        { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        0.4 + Math.random() * 0.4,
        10 + Math.random() * 12,
        'rgba(251, 146, 60, 0.4)',
        'nitro'
      )
    }
  }

  private getDistanceToSegment(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): { distance: number; closestPoint: Vec2; t: number } {
    const dx = x2 - x1
    const dy = y2 - y1
    const lenSq = dx * dx + dy * dy

    if (lenSq === 0) {
      return {
        distance: Math.hypot(px - x1, py - y1),
        closestPoint: { x: x1, y: y1 },
        t: 0,
      }
    }

    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq
    t = Math.max(0, Math.min(1, t))

    const closestX = x1 + t * dx
    const closestY = y1 + t * dy

    return {
      distance: Math.hypot(px - closestX, py - closestY),
      closestPoint: { x: closestX, y: closestY },
      t,
    }
  }

  private checkTrackCollision(): void {
    const car = this.car
    const track = this.track
    const waypoints = track.waypoints
    let minDist = Infinity
    let closestPoint: Vec2 = { x: 0, y: 0 }

    for (let i = 0; i < waypoints.length; i++) {
      const wp1 = waypoints[i]
      const wp2 = waypoints[(i + 1) % waypoints.length]

      const result = this.getDistanceToSegment(
        car.position.x,
        car.position.y,
        wp1.x,
        wp1.y,
        wp2.x,
        wp2.y
      )

      if (result.distance < minDist) {
        minDist = result.distance
        closestPoint = result.closestPoint
      }
    }

    const roadHalfWidth = track.width / 2
    if (minDist > roadHalfWidth) {
      car.speed *= 0.95

      const pushAngle = Math.atan2(
        closestPoint.y - car.position.y,
        closestPoint.x - car.position.x
      )
      const pushDist = minDist - roadHalfWidth
      car.position.x += Math.cos(pushAngle) * pushDist * 0.3
      car.position.y += Math.sin(pushAngle) * pushDist * 0.3
    }
  }

  private checkWaypoints(): void {
    const car = this.car
    const waypoints = this.track.waypoints
    const currentWp = waypoints[this.currentWaypointIndex]

    const dist = Math.hypot(car.position.x - currentWp.x, car.position.y - currentWp.y)

    if (dist < 80) {
      this.lastWaypointIndex = this.currentWaypointIndex
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % waypoints.length

      if (this.currentWaypointIndex === 0 && this.lastWaypointIndex === waypoints.length - 1) {
        this.completeLap()
      }
    }
  }

  private completeLap(): void {
    this.lastLapTime = this.lapTime
    this.lastLapDriftScore = Math.floor(this.driftScore)
    this.lastLapNitroUses = this.nitroUses
    this.lap++
    if (this.bestLapTime === null || this.lastLapTime < this.bestLapTime) {
      this.bestLapTime = this.lastLapTime
    }
    this.lapTime = 0
    this.driftScore = 0
    this.nitroUses = 0
    this.lapJustCompleted = true
  }

  public hasLapJustCompleted(): boolean {
    const completed = this.lapJustCompleted
    this.lapJustCompleted = false
    return completed
  }

  public getLapData(): {
    lap: number
    lapTime: number
    bestLapTime: number | null
    driftScore: number
    nitroUses: number
    completed: boolean
  } {
    return {
      lap: this.lap,
      lapTime: this.lapTime,
      bestLapTime: this.bestLapTime,
      driftScore: Math.floor(this.driftScore),
      nitroUses: this.nitroUses,
      completed: this.lap > 0,
    }
  }
}
