import * as PIXI from 'pixi.js'
import { ResourceType, COLORS, CELL_SIZE } from '../types'

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
  private pulsePhase: number = Math.random() * Math.PI * 2
  private baseScale: number = 1

  constructor(id: number, type: ResourceType, reserve: number, efficiency: number, gridX: number, gridY: number) {
    this.id = id
    this.type = type
    this.reserve = reserve
    this.maxReserve = reserve
    this.efficiency = efficiency
    this.gridX = gridX
    this.gridY = gridY

    this.graphics = new PIXI.Graphics()
    this.label = new PIXI.Text('', {
      fontFamily: 'Orbitron',
      fontSize: 10,
      fill: 0xffffff,
      align: 'center',
    })
    this.label.anchor.set(0.5)
    this.draw()
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
    g.lineStyle(2, color, 0.8)
    this.drawHexagon(g, 0, 0, size)
    g.endFill()

    g.beginFill(color, 0.15)
    g.lineStyle(1, color, 0.4)
    this.drawHexagon(g, 0, 0, size * 1.4)
    g.endFill()

    this.updateLabel()
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
    this.label.text = `${typeName}\n${Math.floor(this.reserve)}`
    this.label.alpha = 0.9
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
    return actual
  }

  update(dt: number): void {
    if (this.depleted) {
      this.baseScale = Math.max(0, this.baseScale - dt * 2)
      if (this.baseScale <= 0) {
        this.graphics.visible = false
        this.label.visible = false
        return
      }
    }

    this.pulsePhase += dt * 2.5
    const pulse = 1 + Math.sin(this.pulsePhase) * 0.08
    const scale = this.baseScale * pulse

    const px = (this.gridX + 0.5) * CELL_SIZE
    const py = (this.gridY + 0.5) * CELL_SIZE

    this.graphics.position.set(px, py)
    this.graphics.scale.set(scale)
    this.label.position.set(px, py - CELL_SIZE * 0.35)

    const pct = this.reserve / this.maxReserve
    this.graphics.alpha = 0.4 + pct * 0.6
  }

  getDisplayObject(): PIXI.Container {
    const container = new PIXI.Container()
    container.addChild(this.graphics)
    container.addChild(this.label)
    return container
  }

  getGraphics(): PIXI.Graphics { return this.graphics }
  getLabel(): PIXI.Text { return this.label }
}
