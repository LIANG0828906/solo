import { v4 as uuidv4 } from 'uuid'

export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 600
export const MAX_BULLETS = 200
export const MAX_ENEMIES = 200

export interface Vector2 {
  x: number
  y: number
}

export class Player {
  id: string
  x: number
  y: number
  speed: number
  size: number
  color: string
  lives: number
  maxLives: number
  isShielded: boolean
  shieldEndTime: number
  isPoweredUp: boolean
  powerUpEndTime: number

  constructor() {
    this.id = uuidv4()
    this.x = CANVAS_WIDTH / 2
    this.y = CANVAS_HEIGHT - 80
    this.speed = 4
    this.size = 20
    this.color = '#00FFD1'
    this.lives = 3
    this.maxLives = 5
    this.isShielded = false
    this.shieldEndTime = 0
    this.isPoweredUp = false
    this.powerUpEndTime = 0
  }

  update(keys: Set<string>, now: number) {
    if (keys.has('w') || keys.has('W')) {
      this.y -= this.speed
    }
    if (keys.has('s') || keys.has('S')) {
      this.y += this.speed
    }
    if (keys.has('a') || keys.has('A')) {
      this.x -= this.speed
    }
    if (keys.has('d') || keys.has('D')) {
      this.x += this.speed
    }

    this.x = Math.max(this.size, Math.min(CANVAS_WIDTH - this.size, this.x))
    this.y = Math.max(this.size, Math.min(CANVAS_HEIGHT - this.size, this.y))

    if (this.isShielded && now > this.shieldEndTime) {
      this.isShielded = false
    }
    if (this.isPoweredUp && now > this.powerUpEndTime) {
      this.isPoweredUp = false
    }
  }

  collidesWith(entity: { x: number; y: number; radius: number }): boolean {
    const dx = this.x - entity.x
    const dy = this.y - entity.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance < this.size + entity.radius
  }

  takeDamage(): boolean {
    if (this.isShielded) return false
    this.lives--
    return this.lives <= 0
  }

  addLife(): boolean {
    if (this.lives < this.maxLives) {
      this.lives++
      return true
    }
    return false
  }

  activateShield(duration: number, now: number) {
    this.isShielded = true
    this.shieldEndTime = now + duration
  }

  activatePowerUp(duration: number, now: number) {
    this.isPoweredUp = true
    this.powerUpEndTime = now + duration
  }

  getShieldScale(now: number): number {
    if (!this.isShielded) return 1
    const elapsed = now - (this.shieldEndTime - 3000)
    const cycleTime = 300
    const phase = (elapsed % cycleTime) / cycleTime
    const scale = 0.8 + 0.4 * Math.sin(phase * Math.PI * 2)
    return scale
  }
}

export class Bullet {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  createdAt: number

  constructor(x: number, y: number, targetX: number, targetY: number, now: number) {
    this.id = uuidv4()
    this.x = x
    this.y = y
    this.radius = 3
    this.color = '#FF007F'
    this.createdAt = now

    const angle = Math.atan2(targetY - y, targetX - x)
    const speed = 6
    this.vx = Math.cos(angle) * speed
    this.vy = Math.sin(angle) * speed
  }

  update() {
    this.x += this.vx
    this.y += this.vy
  }

  isOffScreen(): boolean {
    return (
      this.x < -this.radius ||
      this.x > CANVAS_WIDTH + this.radius ||
      this.y < -this.radius ||
      this.y > CANVAS_HEIGHT + this.radius
    )
  }
}

export class Enemy {
  id: string
  x: number
  y: number
  radius: number
  color: string
  baseSpeed: number
  amplitude: number
  frequency: number
  startX: number
  time: number
  createdAt: number

  constructor(now: number) {
    this.id = uuidv4()
    this.radius = 18
    this.color = '#FFAA00'
    this.baseSpeed = 1
    this.amplitude = 40
    this.frequency = 0.02
    this.startX = Math.random() * (CANVAS_WIDTH - 100) + 50
    this.x = this.startX
    this.y = -this.radius
    this.time = 0
    this.createdAt = now
  }

  update() {
    this.time++
    this.y += this.baseSpeed
    this.x = this.startX + Math.sin(this.time * this.frequency) * this.amplitude
  }

  isOffScreen(): boolean {
    return this.y > CANVAS_HEIGHT + this.radius
  }
}

export class PowerUp {
  id: string
  x: number
  y: number
  radius: number
  color: string
  speed: number
  createdAt: number
  lifetime: number

  constructor(x: number, y: number, now: number) {
    this.id = uuidv4()
    this.x = x
    this.y = y
    this.radius = 8
    this.color = '#7B68EE'
    this.speed = 0.5
    this.createdAt = now
    this.lifetime = 5000
  }

  update() {
    this.y += this.speed
  }

  isExpired(now: number): boolean {
    return now - this.createdAt > this.lifetime
  }

  isOffScreen(): boolean {
    return this.y > CANVAS_HEIGHT + this.radius
  }
}

export class Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  createdAt: number
  lifetime: number

  constructor(x: number, y: number, vx: number, vy: number, now: number) {
    this.id = uuidv4()
    this.x = x
    this.y = y
    this.vx = vx
    this.vy = vy
    this.radius = 3
    this.color = '#FF6347'
    this.createdAt = now
    this.lifetime = 500
  }

  update() {
    this.x += this.vx
    this.y += this.vy
  }

  getAlpha(now: number): number {
    const elapsed = now - this.createdAt
    return Math.max(0, 1 - elapsed / this.lifetime)
  }

  isExpired(now: number): boolean {
    return now - this.createdAt > this.lifetime
  }
}

export class Star {
  x: number
  y: number
  radius: number
  alpha: number

  constructor() {
    this.x = Math.random() * CANVAS_WIDTH
    this.y = Math.random() * CANVAS_HEIGHT
    this.radius = 1 + Math.random()
    this.alpha = 0.3 + Math.random() * 0.5
  }
}
