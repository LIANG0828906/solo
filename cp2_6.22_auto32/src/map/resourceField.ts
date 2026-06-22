import * as PIXI from 'pixi.js'
import { ResourceType, COLORS, CELL_SIZE } from '../types'

interface RingParticle {
  angle: number
  radius: number
  radiusSpeed: number
  phase: number
  baseSize: number
  alpha: number
  orbitSpeed: number
  radiusWobbleAmp: number
}

const PARTICLE_COUNT = 24
const DEPLETED_FADE_DURATION = 0.5
const DISPLAY_LERP_SPEED = 15

function hexToRgb(hex: number): { r: number; g: number; b: number } {
  return {
    r: (hex >> 16) & 255,
    g: (hex >> 8) & 255,
    b: hex & 255,
  }
}

function rgbToHex(r: number, g: number, b: number): number {
  return ((Math.round(r) & 255) << 16) | ((Math.round(g) & 255) << 8) | (Math.round(b) & 255)
}

function lerpColor(colorA: number, colorB: number, t: number): number {
  const a = hexToRgb(colorA)
  const b = hexToRgb(colorB)
  return rgbToHex(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t,
  )
}

function getProgressColor(resourceColor: number, pct: number): number {
  if (pct >= 0.5) {
    const t = (pct - 0.5) / 0.5
    return lerpColor(0xffaa00, resourceColor, t)
  } else {
    const t = pct / 0.2
    if (pct <= 0.2) {
      return lerpColor(0xff3333, 0xffaa00, Math.max(0, t))
    } else {
      const t2 = (pct - 0.2) / 0.3
      return lerpColor(0xffaa00, resourceColor, t2 * 0.5)
    }
  }
}

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
  private depletedFade: number = 1
  private displayedReserve: number = 0
  private lastDisplayedPct: number = 1

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
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this.particles.push({
        angle: (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.5,
        radius: CELL_SIZE * (0.45 + Math.random() * 0.18),
        radiusSpeed: 0,
        phase: Math.random() * Math.PI * 2,
        baseSize: 1.0 + Math.random() * 1.4,
        alpha: 0.65 + Math.random() * 0.35,
        orbitSpeed: 0.4 + Math.random() * 0.5,
        radiusWobbleAmp: 2 + Math.random() * 4,
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
    const pct = Math.max(0, this.displayedReserve / this.maxReserve)
    const typeName = this.type === ResourceType.IRON ? 'Fe' : this.type === ResourceType.CRYSTAL ? 'Cr' : 'Ga'
    this.label.text = `${typeName}  ${Math.floor(pct * 100)}%`
  }

  private updateProgressBar(): void {
    const g = this.progressBar
    g.clear()

    const barWidth = CELL_SIZE * 0.6
    const barHeight = 3
    const y = -CELL_SIZE * 0.2
    const color = this.getColor()
    const displayPct = Math.max(0, Math.min(1, this.displayedReserve / this.maxReserve))

    g.beginFill(0x000000, 0.55)
    g.lineStyle(0.5, color, 0.45)
    g.drawRect(-barWidth / 2, y, barWidth, barHeight)
    g.endFill()

    const barColor = getProgressColor(color, displayPct)
    g.beginFill(barColor, 1.0)
    g.drawRect(-barWidth / 2, y, barWidth * displayPct, barHeight)
    g.endFill()

    g.beginFill(color, 0.35)
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
    for (const p of this.particles) {
      p.angle += dt * p.orbitSpeed
      p.phase += dt * 1.8
    }
  }

  private drawParticles(pct: number): void {
    const g = this.particleGraphics
    g.clear()
    const color = this.getColor()

    const minPct = 0.08
    const effectivePct = Math.max(0, (pct - minPct) / (1 - minPct))
    const maxAlpha = 0.75
    const minAlpha = 0.0

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]

      const particleIndexPct = (i + 1) / PARTICLE_COUNT
      const fadeThreshold = 1 - effectivePct
      let particleAlpha = 1
      if (particleIndexPct > fadeThreshold) {
        const excess = (particleIndexPct - fadeThreshold) / Math.max(0.001, 1 - fadeThreshold)
        particleAlpha = 1 - excess
      }

      const wobble = Math.sin(p.phase) * p.radiusWobbleAmp
      const currentRadius = p.radius + wobble
      const x = Math.cos(p.angle) * currentRadius
      const y = Math.sin(p.angle) * currentRadius

      const sizeMod = 0.5 + effectivePct * 0.5 + Math.sin(p.phase * 1.3) * 0.15
      const size = p.baseSize * sizeMod

      const finalAlpha = Math.max(0, p.alpha * particleAlpha * this.depletedFade)
      if (finalAlpha <= 0.01) continue

      g.beginFill(color, finalAlpha)
      g.drawCircle(x, y, size)
      g.endFill()

      g.beginFill(color, finalAlpha * 0.18)
      g.drawCircle(x, y, size * 2.5)
      g.endFill()
    }
  }

  update(dt: number): void {
    if (this.depleted) {
      this.depletedFade = Math.max(0, this.depletedFade - dt / DEPLETED_FADE_DURATION)
      this.baseScale = Math.max(0, this.baseScale - dt / DEPLETED_FADE_DURATION)
      if (this.depletedFade <= 0) {
        this.graphics.visible = false
        this.label.visible = false
        this.progressBar.visible = false
        this.particleGraphics.visible = false
        return
      }
    }

    this.displayedReserve += (this.reserve - this.displayedReserve) * Math.min(1, dt * DISPLAY_LERP_SPEED)
    const displayPct = this.displayedReserve / this.maxReserve

    this.pulsePhase += dt * 3.0
    const pct = this.reserve / this.maxReserve
    const lowResource = pct < 0.2 && !this.depleted

    const pulseIntensity = lowResource ? 0.22 : 0.14
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
      this.graphics.alpha = (0.3 + blinkPhase * 0.5) * this.depletedFade
      this.progressBar.alpha = 0.85 * this.depletedFade
      this.label.alpha = 0.85 * this.depletedFade
    } else {
      this.graphics.alpha = (0.55 + pct * 0.45) * this.depletedFade
      this.progressBar.alpha = 0.95 * this.depletedFade
      this.label.alpha = 0.95 * this.depletedFade
    }

    this.updateProgressBar()
    this.updateParticles(dt, displayPct)
    this.drawParticles(displayPct)
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
