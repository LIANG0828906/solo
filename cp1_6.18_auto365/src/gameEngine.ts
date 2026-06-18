import { AudioFeatures, GameSnapshot, ShipState, Meteorite, Particle, Star, Explosion, ManualTrigger } from './store'

const JUMP_HEIGHT = 80
const JUMP_DURATION = 0.4
const DODGE_DISTANCE = 60
const DODGE_DURATION = 0.2
const MANUAL_DISTANCE = 30
const MANUAL_COOLDOWN = 1.5
const HIT_DAMAGE = 25
const MAX_HEALTH = 100
const BASE_SPEED = 3
const BPM_SPEED_INCREMENT = 0.2
const BPM_STEP = 10
const BASE_SPAWN_INTERVAL_MAX = 3
const BASE_SPAWN_INTERVAL_MIN = 1.5
const SPAWN_DECREASE_PER_HUNDRED = 0.1
const MIN_SPAWN_INTERVAL = 0.8
const SCORE_PER_SECOND = 10
const STAR_COUNT = 80

const BG_COLORS = ['#0D1B2A', '#1A0A2E', '#2D0A0A']

function lerpColor(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16)
  const ag = parseInt(a.slice(3, 5), 16)
  const ab = parseInt(a.slice(5, 7), 16)
  const br = parseInt(b.slice(1, 3), 16)
  const bg = parseInt(b.slice(3, 5), 16)
  const bb = parseInt(b.slice(5, 7), 16)
  const rr = Math.round(ar + (br - ar) * t)
  const rg = Math.round(ag + (bg - ag) * t)
  const rb = Math.round(ab + (bb - ab) * t)
  return `#${rr.toString(16).padStart(2, '0')}${rg.toString(16).padStart(2, '0')}${rb.toString(16).padStart(2, '0')}`
}

export class GameEngine {
  private ship: ShipState
  private meteorites: Meteorite[] = []
  private particles: Particle[] = []
  private stars: Star[] = []
  private explosions: Explosion[] = []
  private nextId = 0

  private score = 0
  private maxBpm = 0
  private survivalTime = 0
  private isGameOver = false

  private canvasWidth: number
  private canvasHeight: number

  private timeSinceLastSpawn = 0
  private lastDodgeDir = 1

  private bgTransitionProgress = 0
  private bgCurrentLevel = 0

  private lastFrameTime = 0
  private frameCount = 0

  constructor(width: number, height: number) {
    this.canvasWidth = width
    this.canvasHeight = height
    this.ship = this.createInitialShip()
    this.stars = this.createStars()
  }

  private createInitialShip(): ShipState {
    return {
      x: this.canvasWidth * 0.12,
      y: this.canvasHeight / 2,
      targetY: this.canvasHeight / 2,
      targetX: this.canvasWidth * 0.12,
      health: MAX_HEALTH,
      maxHealth: MAX_HEALTH,
      isJumping: false,
      isDodging: false,
      manualCooldown: 0,
      jumpProgress: 0,
      dodgeProgress: 0,
      jumpStartY: this.canvasHeight / 2,
      dodgeStartX: this.canvasWidth * 0.12
    }
  }

  private createStars(): Star[] {
    const stars: Star[] = []
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        radius: 0.5 + Math.random() * 1.5,
        baseOpacity: 0.2 + Math.random() * 0.8,
        opacity: 0.5,
        twinkleSpeed: 0.5 + Math.random() * 2,
        twinklePhase: Math.random() * Math.PI * 2
      })
    }
    return stars
  }

  resize(width: number, height: number): void {
    const xRatio = width / this.canvasWidth
    const yRatio = height / this.canvasHeight
    this.canvasWidth = width
    this.canvasHeight = height
    this.ship.x *= xRatio
    this.ship.y *= yRatio
    this.ship.targetX *= xRatio
    this.ship.targetY *= yRatio
    this.ship.jumpStartY *= yRatio
    this.ship.dodgeStartX *= xRatio
    this.stars.forEach(s => {
      s.x *= xRatio
      s.y *= yRatio
    })
  }

  reset(): void {
    this.ship = this.createInitialShip()
    this.meteorites = []
    this.particles = []
    this.explosions = []
    this.score = 0
    this.maxBpm = 0
    this.survivalTime = 0
    this.isGameOver = false
    this.timeSinceLastSpawn = 0
    this.lastDodgeDir = 1
    this.bgTransitionProgress = 0
    this.bgCurrentLevel = 0
    this.lastFrameTime = 0
    this.frameCount = 0
    this.stars = this.createStars()
  }

  update(audio: AudioFeatures, deltaTime: number, manualTrigger: ManualTrigger | null): GameSnapshot {
    if (this.isGameOver) {
      return this.buildSnapshot(audio)
    }

    if (this.lastFrameTime === 0) this.lastFrameTime = performance.now()
    this.frameCount++

    this.survivalTime += deltaTime
    this.score += SCORE_PER_SECOND * deltaTime

    if (audio.bpm > this.maxBpm) this.maxBpm = audio.bpm

    this.updateShipFromAudio(audio, deltaTime)
    this.handleManualTrigger(manualTrigger)
    this.updateShipPosition(deltaTime)

    this.updateMeteoriteSpawning(audio, deltaTime)
    this.updateMeteorites(deltaTime)
    this.checkCollisions()

    this.updateStars(deltaTime)
    this.updateParticles(deltaTime)
    this.updateExplosions(deltaTime)
    this.updateBackground()
    this.updateFlameParticles()

    return this.buildSnapshot(audio)
  }

  private updateShipFromAudio(audio: AudioFeatures, _deltaTime: number): void {
    if (audio.beatDetected && audio.beatType === 'low' && !this.ship.isJumping) {
      this.ship.isJumping = true
      this.ship.jumpProgress = 0
      this.ship.jumpStartY = this.ship.y
      this.ship.targetY = Math.max(30, this.ship.y - JUMP_HEIGHT)
    }

    if (audio.beatDetected && audio.beatType === 'high' && !this.ship.isDodging) {
      this.ship.isDodging = true
      this.ship.dodgeProgress = 0
      this.ship.dodgeStartX = this.ship.x
      const dir = this.lastDodgeDir * -1
      this.lastDodgeDir = dir
      this.ship.targetX = Math.max(30, Math.min(this.canvasWidth - 30, this.ship.x + DODGE_DISTANCE * dir))
    }
  }

  private handleManualTrigger(trigger: ManualTrigger | null): void {
    if (!trigger || this.ship.manualCooldown > 0) return
    this.ship.manualCooldown = MANUAL_COOLDOWN
    this.ship.targetX = Math.max(30, Math.min(this.canvasWidth - 30, this.ship.x + MANUAL_DISTANCE * trigger.direction))
    this.ship.dodgeStartX = this.ship.x
    this.ship.isDodging = true
    this.ship.dodgeProgress = 0
  }

  private updateShipPosition(deltaTime: number): void {
    this.ship.manualCooldown = Math.max(0, this.ship.manualCooldown - deltaTime)

    if (this.ship.isJumping) {
      this.ship.jumpProgress += deltaTime / JUMP_DURATION
      if (this.ship.jumpProgress >= 1) {
        this.ship.jumpProgress = 1
        this.ship.isJumping = false
        this.ship.y = this.ship.targetY
      } else {
        const t = this.ship.jumpProgress
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
        this.ship.y = this.ship.jumpStartY + (this.ship.targetY - this.ship.jumpStartY) * ease
      }
    }

    if (this.ship.isDodging) {
      this.ship.dodgeProgress += deltaTime / DODGE_DURATION
      if (this.ship.dodgeProgress >= 1) {
        this.ship.dodgeProgress = 1
        this.ship.isDodging = false
        this.ship.x = this.ship.targetX
      } else {
        const t = this.ship.dodgeProgress
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
        this.ship.x = this.ship.dodgeStartX + (this.ship.targetX - this.ship.dodgeStartX) * ease
      }
    }

    if (!this.ship.isJumping) {
      const centerY = this.canvasHeight / 2
      this.ship.y += (centerY - this.ship.y) * 0.02
      this.ship.targetY = this.ship.y
    }
  }

  private getSpawnInterval(): number {
    const scoreLevel = Math.floor(this.score / 100)
    const baseInterval = BASE_SPAWN_INTERVAL_MIN + Math.random() * (BASE_SPAWN_INTERVAL_MAX - BASE_SPAWN_INTERVAL_MIN)
    const decreased = baseInterval - scoreLevel * SPAWN_DECREASE_PER_HUNDRED
    return Math.max(MIN_SPAWN_INTERVAL, decreased)
  }

  private getBaseSpeed(bpm: number): number {
    const bpmAboveBase = Math.max(0, bpm - 60)
    return BASE_SPEED + Math.floor(bpmAboveBase / BPM_STEP) * BPM_SPEED_INCREMENT
  }

  private updateMeteoriteSpawning(audio: AudioFeatures, deltaTime: number): void {
    this.timeSinceLastSpawn += deltaTime
    const interval = this.getSpawnInterval()

    if (this.timeSinceLastSpawn >= interval) {
      this.timeSinceLastSpawn = 0
      this.spawnMeteorite(audio)
    }
  }

  private spawnMeteorite(audio: AudioFeatures): void {
    const speed = this.getBaseSpeed(audio.bpm)
    const rand = Math.random()
    let type: Meteorite['type']
    if (rand < 0.5) {
      type = 'normal'
    } else if (rand < 0.8) {
      type = 'burning'
    } else {
      type = 'splitting'
    }

    let width: number, height: number
    switch (type) {
      case 'normal': width = 16; height = 16; break
      case 'burning': width = 24; height = 16; break
      case 'splitting': width = 20; height = 20; break
    }

    const margin = 40
    const y = margin + Math.random() * (this.canvasHeight - margin * 2)

    this.meteorites.push({
      id: this.nextId++,
      x: this.canvasWidth + width,
      y,
      type,
      speed: speed * (0.8 + Math.random() * 0.4),
      width,
      height,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 3,
      splitCount: 0
    })
  }

  private spawnSplitMeteorite(parent: Meteorite, offsetY: number): void {
    const child: Meteorite = {
      id: this.nextId++,
      x: parent.x,
      y: parent.y + offsetY,
      type: 'normal',
      speed: parent.speed * 1.2,
      width: 10,
      height: 10,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 4,
      splitCount: 1
    }
    this.meteorites.push(child)
  }

  private updateMeteorites(deltaTime: number): void {
    const fps = 1 / Math.max(deltaTime, 0.001)
    const speedMult = deltaTime * fps

    for (let i = this.meteorites.length - 1; i >= 0; i--) {
      const m = this.meteorites[i]
      m.x -= m.speed * speedMult
      m.rotation += m.rotationSpeed * deltaTime

      if (m.type === 'burning' && Math.random() < 0.6) {
        this.particles.push({
          x: m.x + m.width,
          y: m.y + (Math.random() - 0.5) * m.height * 0.6,
          vx: 0.5 + Math.random() * 1.5,
          vy: (Math.random() - 0.5) * 0.8,
          life: 0.4 + Math.random() * 0.3,
          maxLife: 0.7,
          size: 2 + Math.random() * 3,
          color: Math.random() < 0.5 ? '#FF6F00' : '#FFB300',
          type: 'trail'
        })
      }

      if (m.x < -m.width * 2) {
        this.meteorites.splice(i, 1)
        this.score += 5
      }
    }
  }

  private checkCollisions(): void {
    const shipRadius = 10
    const sx = this.ship.x
    const sy = this.ship.y

    for (let i = this.meteorites.length - 1; i >= 0; i--) {
      const m = this.meteorites[i]
      const dx = sx - m.x
      const dy = sy - m.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const hitDist = shipRadius + Math.max(m.width, m.height) / 2

      if (dist < hitDist * 0.75) {
        if (m.type === 'splitting' && m.splitCount === 0) {
          this.spawnSplitMeteorite(m, -12)
          this.spawnSplitMeteorite(m, 12)
        }

        this.explosions.push({
          x: m.x,
          y: m.y,
          life: 0.3,
          maxLife: 0.3
        })

        this.spawnExplosionParticles(m.x, m.y)

        this.ship.health -= HIT_DAMAGE
        this.meteorites.splice(i, 1)

        if (this.ship.health <= 0) {
          this.ship.health = 0
          this.isGameOver = true
        }
      }
    }
  }

  private spawnExplosionParticles(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const speed = 40 + Math.random() * 30
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.15,
        maxLife: 0.45,
        size: 2 + Math.random() * 2,
        color: Math.random() < 0.5 ? '#FF6D00' : '#FF3D00',
        type: 'explosion'
      })
    }
  }

  private updateFlameParticles(): void {
    if (this.isGameOver) return

    const count = 6 + Math.floor(Math.random() * 5)
    for (let i = 0; i < count; i++) {
      const t = Math.random()
      const r = Math.floor(255)
      const g = Math.floor(111 + (179 - 111) * t)
      const b = 0
      this.particles.push({
        x: this.ship.x - 8 + (Math.random() - 0.5) * 4,
        y: this.ship.y + (Math.random() - 0.5) * 6,
        vx: -2 - Math.random() * 3,
        vy: (Math.random() - 0.5) * 1.5,
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.6,
        size: 3 + Math.random() * 3,
        color: `rgb(${r},${g},${b})`,
        type: 'flame'
      })
    }
  }

  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx * deltaTime
      p.y += p.vy * deltaTime
      p.life -= deltaTime

      if (p.type === 'explosion') {
        p.vx *= 0.95
        p.vy *= 0.95
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  private updateExplosions(deltaTime: number): void {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].life -= deltaTime
      if (this.explosions[i].life <= 0) {
        this.explosions.splice(i, 1)
      }
    }
  }

  private updateStars(deltaTime: number): void {
    for (const star of this.stars) {
      star.twinklePhase += star.twinkleSpeed * deltaTime
      star.opacity = star.baseOpacity * (0.2 + 0.8 * (0.5 + 0.5 * Math.sin(star.twinklePhase)))
    }
  }

  private updateBackground(): void {
    const scoreLevel = Math.floor(this.score / 100)
    const maxLevel = BG_COLORS.length - 1

    if (scoreLevel !== this.bgCurrentLevel && scoreLevel < maxLevel) {
      this.bgCurrentLevel = scoreLevel
      this.bgTransitionProgress = 0
    }

    if (this.bgCurrentLevel < maxLevel) {
      this.bgTransitionProgress = Math.min(1, this.bgTransitionProgress + 0.016)
    }
  }

  private getBackgroundColor(): string {
    const level = Math.min(this.bgCurrentLevel, BG_COLORS.length - 2)
    const nextLevel = level + 1
    return lerpColor(BG_COLORS[level], BG_COLORS[nextLevel], this.bgTransitionProgress)
  }

  private buildSnapshot(audio: AudioFeatures): GameSnapshot {
    return {
      ship: { ...this.ship },
      meteorites: this.meteorites.map(m => ({ ...m })),
      particles: this.particles.map(p => ({ ...p })),
      stars: this.stars,
      explosions: this.explosions.map(e => ({ ...e })),
      score: Math.floor(this.score),
      bpm: audio.bpm,
      maxBpm: this.maxBpm,
      survivalTime: this.survivalTime,
      isGameOver: this.isGameOver,
      backgroundColor: this.getBackgroundColor(),
      spawnInterval: this.getSpawnInterval(),
      baseSpeed: this.getBaseSpeed(audio.bpm)
    }
  }
}
