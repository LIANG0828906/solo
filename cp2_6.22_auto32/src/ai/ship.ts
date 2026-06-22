import * as PIXI from 'pixi.js'
import { COLORS, CELL_SIZE } from '../types'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: number
}

const PARTICLE_POOL_SIZE = 60

export class Ship {
  x: number = 0
  y: number = 0
  speed: number = 1.5
  hp: number
  maxHp: number
  firepower: number
  armor: number
  cargoCapacity: number = 50
  cargoIron: number = 0
  cargoCrystal: number = 0
  cargoGas: number = 0

  private graphics: PIXI.Graphics
  private hpBar: PIXI.Graphics
  private particles: Particle[] = []
  private particleGraphics: PIXI.Graphics
  private isMoving: boolean = false
  private moveAngle: number = 0
  private color: number

  constructor(color: number = COLORS.NEON_BLUE) {
    this.color = color
    this.hp = 80 + Math.random() * 40
    this.maxHp = this.hp
    this.firepower = 15 + Math.random() * 15
    this.armor = 10 + Math.random() * 10
    this.speed = 1.2 + Math.random() * 0.8

    this.graphics = new PIXI.Graphics()
    this.hpBar = new PIXI.Graphics()
    this.particleGraphics = new PIXI.Graphics()

    this.initParticles()
    this.drawShip()
  }

  private initParticles(): void {
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      this.particles.push({
        x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 0.5,
        color: this.color,
      })
    }
  }

  private drawShip(): void {
    const g = this.graphics
    g.clear()

    g.beginFill(this.color, 0.9)
    g.lineStyle(1, 0xffffff, 0.5)
    g.moveTo(10, 0)
    g.lineTo(-6, -6)
    g.lineTo(-3, 0)
    g.lineTo(-6, 6)
    g.closePath()
    g.endFill()

    g.beginFill(0xffffff, 0.3)
    g.drawCircle(0, 0, 2)
    g.endFill()
  }

  setMoving(moving: boolean, angle: number = 0): void {
    this.isMoving = moving
    this.moveAngle = angle
  }

  setPosition(x: number, y: number): void {
    this.x = x
    this.y = y
  }

  takeDamage(amount: number): void {
    const actualDamage = Math.max(1, amount - this.armor * 0.3)
    this.hp = Math.max(0, this.hp - actualDamage)
  }

  isAlive(): boolean {
    return this.hp > 0
  }

  getTotalCargo(): number {
    return this.cargoIron + this.cargoCrystal + this.cargoGas
  }

  private emitParticle(): void {
    if (!this.isMoving) return

    const dead = this.particles.find(p => p.life <= 0)
    if (!dead) return

    const spread = (Math.random() - 0.5) * 1.5
    dead.x = this.x - Math.cos(this.moveAngle) * 8
    dead.y = this.y - Math.sin(this.moveAngle) * 8
    dead.vx = -Math.cos(this.moveAngle + spread) * (1 + Math.random() * 2)
    dead.vy = -Math.sin(this.moveAngle + spread) * (1 + Math.random() * 2)
    dead.life = 0.3 + Math.random() * 0.3
    dead.maxLife = dead.life
    dead.color = this.color
  }

  update(dt: number): void {
    this.graphics.position.set(this.x, this.y)
    this.graphics.rotation = this.moveAngle

    if (this.isMoving) {
      this.emitParticle()
      this.emitParticle()
    }

    for (const p of this.particles) {
      if (p.life > 0) {
        p.x += p.vx * dt * 60
        p.y += p.vy * dt * 60
        p.life -= dt
      }
    }

    this.drawParticles()
    this.drawHpBar()
  }

  private drawParticles(): void {
    const g = this.particleGraphics
    g.clear()
    for (const p of this.particles) {
      if (p.life > 0) {
        const alpha = (p.life / p.maxLife) * 0.6
        const size = (p.life / p.maxLife) * 3
        g.beginFill(p.color, alpha)
        g.drawCircle(p.x, p.y, size)
        g.endFill()
      }
    }
  }

  private drawHpBar(): void {
    const g = this.hpBar
    g.clear()
    g.position.set(this.x - 10, this.y + 10)

    g.beginFill(0x333333, 0.5)
    g.drawRect(0, 0, 20, 2)
    g.endFill()

    const hpRatio = this.hp / this.maxHp
    const hpColor = hpRatio > 0.6 ? 0x00ff88 : hpRatio > 0.3 ? 0xffaa00 : 0xff3333
    g.beginFill(hpColor, 0.8)
    g.drawRect(0, 0, 20 * hpRatio, 2)
    g.endFill()
  }

  getDisplayObject(): PIXI.Container {
    const container = new PIXI.Container()
    container.addChild(this.particleGraphics)
    container.addChild(this.graphics)
    container.addChild(this.hpBar)
    return container
  }

  getGraphics(): PIXI.Graphics { return this.graphics }
  getParticleGraphics(): PIXI.Graphics { return this.particleGraphics }
  getHpBar(): PIXI.Graphics { return this.hpBar }
}
