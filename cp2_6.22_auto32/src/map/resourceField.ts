import * as PIXI from 'pixi.js'
import { ResourceType, COLORS, CELL_SIZE } from '../types'

interface RingParticle {
  angle: number
  radius: number
  radiusSpeed: number
  phase: number
  size: number
  alpha: number
  fadePhase: number
  shouldFade: boolean
}

const MAX_PARTICLES = 24
const PARTICLE_FADE_SPEED = 2.5

export class ResourceField {
  id: number
  type: ResourceType
  reserve: number
  maxReserve: number
  efficiency: number
  gridX: number
  gridY: number
  depleted: boolean = false

  private graphics: PIXI.Graphics
  private label: PIXI.Text
  private progressBar: PIXI.Graphics
  private particleContainer: PIXI.Container
  private particleGraphics: PIXI.Graphics
  private particles: RingParticle[] = []
  private pulsePhase: number = Math.random() * Math.PI * 2
  private baseScale: number = 1
  private displayedReserve: number = 0
  private lastPct: number = 1

  constructor(id: number, type: ResourceType, reserve: number, efficiency: number, gridX: number, gridY: number) {
    this.id = id
    this.type = type
    this.reserve = reserve
    this.maxReserve = reserve
    this.efficiency = efficiency
    this.gridX = gridX
    this.gridY = gridY
    this.displayedReserve = reserve

    this.graphics = new PIXI.Graphics()
    this.label = new PIXI.Text('', {
      fontFamily: 'Orbitron',
      fontSize: 10,
      fill: 0xffffff,
      align: 'center',
    })
    this.label.anchor.set(0.5)

    this.progressBar = new PIXI.Graphics()
    this.particleContainer = new PIXI.Container()
    this.particleGraphics = new PIXI.Graphics()
    this.particleContainer.addChild(this.particleGraphics)

    this.initParticles()
    this.draw()
  }

  private initParticles(): void {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        angle: (Math.PI * 2 * i) / MAX_PARTICLES + Math.random() * 0.3,
        radius: CELL_SIZE * (0.45 + Math.random() * 0.15),
        radiusSpeed: 0,
        phase: Math.random() * Math.PI * 2,
        size: 1.2 + Math.random() * 1.5,
        alpha: 0.7 + Math.random() * 0.3,
        fadePhase: 1,
        shouldFade: false,
      })
    }
  }

  private getColor(): number {
    switch (this.type) {
      case ResourceType.IRON: return COLORS.IRON
      case ResourceType.CRYSTAL: return COLORS.CRYSTAL
      case ResourceType.GAS: return COLORS.GAS
    }
  }

  private draw(): void {
    const g = this.graphics
    g.clear()

    const color = this.getColor()
    const size = CELL_SIZE * 0.4

    g.beginFill(color, 0.25)
    g.lineStyle(2, color, 0.9)
    this.drawHexagon(g, 0, 0, size)
    g.endFill()

    g.beginFill(color, 0.12)
    g.lineStyle(1, color, 0.4)
    this.drawHexagon(g, 0, 0, size * 1.5)
    g.endFill()

    g.beginFill(color, 0.05)
    g.lineStyle(0.5, color, 0.2)
    this.drawHexagon(g, 0, 0, size * 2.0)
    g.endFill()

    this.updateLabel()
    this.updateProgressBar()
  }

  private drawHexagon(g: PIXI.Graphics, cx: number, cy: number, radius: number): void {
    const points: number[] = []
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6
      points.push(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle))
    }
    g.moveTo(points[0], points[1])
    for (let i = 2; i < points.length; i += 2) {
      g.lineTo(points[i], points[i + 1])
    }
    g.closePath()
  }

  private updateLabel(): void {
    const pct = Math.max(0, this.reserve / this.maxReserve)
    const typeName = this.type === ResourceType.IRON ? 'Fe' : this.type === ResourceType.CRYSTAL ? 'Cr' : 'Ga'
    this.label.text = `${typeName}  ${Math.floor(pct * 100)}%`
    this.label.alpha = 0.95
  }

  private updateProgressBar(): void {
    const g = this.progressBar
    g.clear()

    const barWidth = CELL_SIZE * 0.6
    const barHeight = 3
    const y = -CELL_SIZE * 0.2
    const color = this.getColor()
    const pct = Math.max(0, Math.min(1, this.reserve / this.maxReserve))
    const displayPct = Math.max(0, Math.min(1, this.displayedReserve / this.maxReserve))

    g.beginFill(0x000000, 0.6)
    g.lineStyle(0.5, color, 0.5)
    g.drawRect(-barWidth / 2, y, barWidth, barHeight)
    g.endFill()

    const barColor = pct > 0.5 ? color : pct > 0.2 ? 0xffaa00 : 0xff5544
    g.beginFill(barColor, 0.9)
    g.drawRect(-barWidth / 2, y, barWidth * displayPct, barHeight)
    g.endFill()

    g.beginFill(color, 0.4)
    for (let i = 0; i < 5; i++) {
      const tickX = -barWidth / 2 + (barWidth * (i + 1)) / 6
      g.drawRect(tickX - 0.5, y, 1, barHeight)
    }
    g.endFill()
  }

  collect(amount: number): number {
    if (this.depleted) return 0
    const actual = Math.min(amount * this.efficiency, this.reserve)
    this.reserve -= actual
    if (this.reserve <= 0) {
      this.reserve = 0
      this.depleted = true
    }
    this.updateLabel()
    this.updateProgressBar()
    return actual
  }

  private updateParticles(dt: number, pct: number): void {
    const activeCount = Math.ceil(MAX_PARTICLES * pct)

    if (pct < this.lastPct) {
      const diffPct = this.lastPct - pct
      const toFade = Math.ceil(MAX_PARTICLES * diffPct * 0.8)
      let faded = 0
      for (const p of this.particles) {
        if (faded >= toFade) break
        if (!p.shouldFade && p.fadePhase >= 1) {
          p.shouldFade = true
          faded++
        }
      }
    }
    this.lastPct = pct

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]

      if (p.shouldFade) {
        p.fadePhase -= dt * PARTICLE_FADE_SPEED
        if (p.fadePhase <= 0) {
          p.fadePhase = 0
          p.shouldFade = false
          p.alpha = 0
          continue
        }
      } else if (i < activeCount && p.fadePhase < 1) {
        p.fadePhase = Math.min(1, p.fadePhase + dt * PARTICLE_FADE_SPEED)
      }

      if (i >= activeCount && !p.shouldFade && p.fadePhase > 0) {
        p.shouldFade = true
      }

      if (p.fadePhase <= 0 && i >= activeCount) {
        p.alpha = 0
        continue
      }

      p.angle += dt * (0.6 + p.phase * 0.2)
      p.phase += dt * 2
      p.radius += Math.sin(p.phase) * dt * 1.5
      p.alpha = Math.max(0, (0.6 + Math.sin(p.phase * 1.3) * 0.3) * p.fadePhase)
    }
  }

  private drawParticles(): void {
    const g = this.particleGraphics
    g.clear()
    const color = this.getColor()

    for (const p of this.particles) {
      if (p.fadePhase <= 0 || p.alpha <= 0) continue
      const x = Math.cos(p.angle) * p.radius
      const y = Math.sin(p.angle) * p.radius
      g.beginFill(color, p.alpha)
      g.drawCircle(x, y, p.size)
      g.endFill()

      g.beginFill(color, p.alpha * 0.2)
      g.drawCircle(x, y, p.size * 2.5)
      g.endFill()
    }
  }

  update(dt: number): void {
    if (this.depleted) {
      this.baseScale = Math.max(0, this.baseScale - dt * 2)
      for (const p of this.particles) {
        p.shouldFade = true
        p.fadePhase = Math.max(0, p.fadePhase - dt * PARTICLE_FADE_SPEED * 2)
        p.alpha = Math.max(0, p.fadePhase)
      }
      if (this.baseScale <= 0) {
        this.graphics.visible = false
        this.label.visible = false
        this.progressBar.visible = false
        return
      }
    }

    this.displayedReserve += (this.reserve - this.displayedReserve) * Math.min(1, dt * 8)

    this.pulsePhase += dt * 3.0
    const pct = this.reserve / this.maxReserve
    const lowResource = pct < 0.2 && !this.depleted

    const pulseIntensity = lowResource ? 0.18 : 0.12
    const pulse = 1 + Math.sin(this.pulsePhase) * pulseIntensity
    const scale = this.baseScale * pulse

    const px = (this.gridX + 0.5) * CELL_SIZE
    const py = (this.gridY + 0.5) * CELL_SIZE

    this.graphics.position.set(px, py)
    this.graphics.scale.set(scale)
    this.label.position.set(px, py - CELL_SIZE * 0.38)
    this.progressBar.position.set(px, py)
    this.particleContainer.position.set(px, py)

    if (lowResource) {
      const blinkPhase = 0.5 + 0.5 * Math.sin(this.pulsePhase * 3)
      this.graphics.alpha = 0.25 + blinkPhase * 0.45
      this.progressBar.alpha = 0.4 + blinkPhase * 0.6
      this.label.alpha = 0.5 + blinkPhase * 0.5
    } else {
      this.graphics.alpha = 0.55 + pct * 0.45
      this.progressBar.alpha = 0.95
      this.label.alpha = 0.95
    }

    this.updateProgressBar()
    this.updateParticles(dt, pct)
    this.drawParticles()
  }

  getDisplayObject(): PIXI.Container {
    const container = new PIXI.Container()
    container.addChild(this.particleContainer)
    container.addChild(this.graphics)
    container.addChild(this.progressBar)
    container.addChild(this.label)
    return container
  }

  getGraphics(): PIXI.Graphics { return this.graphics }
  getLabel(): PIXI.Text { return this.label }
  getProgressBar(): PIXI.Graphics { return this.progressBar }
  getParticleGraphics(): PIXI.Graphics { return this.particleGraphics }
}
