import * as PIXI from 'pixi.js'
import { COLORS, CELL_SIZE, UPGRADE_COSTS, WAREHOUSE_CAPACITY, BUILD_SPEED, INFLUENCE_RANGE, ResourceStorage, UpgradeCost } from '../types'

export interface Base {
  id: number
  gridX: number
  gridY: number
  level: number
  storage: ResourceStorage
  warehouseCapacity: number
  buildSpeed: number
  influenceRange: number
}

export class BaseManager {
  bases: Base[] = []
  private nextId: number = 1
  private baseGraphics: Map<number, PIXI.Graphics> = new Map()
  private baseLabels: Map<number, PIXI.Text> = new Map()
  private baseContainer: PIXI.Container
  private influenceGraphics: PIXI.Graphics
  private rippleEffects: Map<number, { phase: number; active: boolean }> = new Map()

  constructor() {
    this.baseContainer = new PIXI.Container()
    this.influenceGraphics = new PIXI.Graphics()
    this.baseContainer.addChild(this.influenceGraphics)
  }

  createBase(gridX: number, gridY: number): Base {
    const base: Base = {
      id: this.nextId++,
      gridX,
      gridY,
      level: 1,
      storage: { iron: 0, crystal: 0, gas: 0 },
      warehouseCapacity: WAREHOUSE_CAPACITY[1],
      buildSpeed: BUILD_SPEED[1],
      influenceRange: INFLUENCE_RANGE[1],
    }
    this.bases.push(base)

    this.rippleEffects.set(base.id, { phase: 0, active: false })
    this.createBaseGraphics(base)

    return base
  }

  private createBaseGraphics(base: Base): void {
    const g = new PIXI.Graphics()
    this.baseGraphics.set(base.id, g)

    const label = new PIXI.Text(`B${base.id} Lv.${base.level}`, {
      fontFamily: 'Orbitron',
      fontSize: 9,
      fill: 0xffffff,
      align: 'center',
    })
    label.anchor.set(0.5)
    this.baseLabels.set(base.id, label)

    this.baseContainer.addChild(g)
    this.baseContainer.addChild(label)
    this.drawBase(base)
  }

  private drawBase(base: Base): void {
    const g = this.baseGraphics.get(base.id)
    if (!g) return

    g.clear()
    const px = (base.gridX + 0.5) * CELL_SIZE
    const py = (base.gridY + 0.5) * CELL_SIZE

    const size = CELL_SIZE * 0.4 + base.level * 3

    g.beginFill(COLORS.BASE, 0.2)
    g.lineStyle(2, COLORS.BASE, 0.9)
    this.drawHexagon(g, px, py, size)
    g.endFill()

    g.beginFill(COLORS.BASE, 0.08)
    g.lineStyle(1, COLORS.BASE, 0.4)
    this.drawHexagon(g, px, py, size + 8)
    g.endFill()

    g.beginFill(0xffffff, 0.3)
    g.drawCircle(px, py, 3 + base.level)
    g.endFill()

    const label = this.baseLabels.get(base.id)
    if (label) {
      label.text = `B${base.id} Lv.${base.level}`
      label.position.set(px, py - size - 10)
    }
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

  canUpgrade(baseId: number): boolean {
    const base = this.bases.find(b => b.id === baseId)
    if (!base || base.level >= 5) return false
    const cost = UPGRADE_COSTS[base.level]
    return base.storage.iron >= cost.iron && base.storage.crystal >= cost.crystal && base.storage.gas >= cost.gas
  }

  upgrade(baseId: number): boolean {
    const base = this.bases.find(b => b.id === baseId)
    if (!base || !this.canUpgrade(baseId)) return false

    const cost = UPGRADE_COSTS[base.level]
    base.storage.iron -= cost.iron
    base.storage.crystal -= cost.crystal
    base.storage.gas -= cost.gas
    base.level++
    base.warehouseCapacity = WAREHOUSE_CAPACITY[base.level]
    base.buildSpeed = BUILD_SPEED[base.level]
    base.influenceRange = INFLUENCE_RANGE[base.level]

    const ripple = this.rippleEffects.get(baseId)
    if (ripple) {
      ripple.phase = 0
      ripple.active = true
    }

    this.drawBase(base)
    this.drawInfluenceRanges()
    return true
  }

  getUpgradeCost(baseId: number): UpgradeCost | null {
    const base = this.bases.find(b => b.id === baseId)
    if (!base || base.level >= 5) return null
    return UPGRADE_COSTS[base.level]
  }

  addResources(baseId: number, resources: ResourceStorage): boolean {
    const base = this.bases.find(b => b.id === baseId)
    if (!base) return false

    const totalNew = resources.iron + resources.crystal + resources.gas
    const totalCurrent = base.storage.iron + base.storage.crystal + base.storage.gas
    if (totalCurrent + totalNew > base.warehouseCapacity) {
      const remaining = base.warehouseCapacity - totalCurrent
      if (remaining <= 0) return false
      const ratio = remaining / totalNew
      base.storage.iron += Math.floor(resources.iron * ratio)
      base.storage.crystal += Math.floor(resources.crystal * ratio)
      base.storage.gas += Math.floor(resources.gas * ratio)
      return true
    }

    base.storage.iron += resources.iron
    base.storage.crystal += resources.crystal
    base.storage.gas += resources.gas
    return true
  }

  getBase(id: number): Base | undefined {
    return this.bases.find(b => b.id === id)
  }

  private drawInfluenceRanges(): void {
    const g = this.influenceGraphics
    g.clear()

    for (const base of this.bases) {
      const px = (base.gridX + 0.5) * CELL_SIZE
      const py = (base.gridY + 0.5) * CELL_SIZE
      const range = base.influenceRange

      g.beginFill(COLORS.BASE, 0.03)
      g.lineStyle(1, COLORS.BASE, 0.15)
      g.drawRect(
        (base.gridX - range) * CELL_SIZE,
        (base.gridY - range) * CELL_SIZE,
        (range * 2 + 1) * CELL_SIZE,
        (range * 2 + 1) * CELL_SIZE,
      )
      g.endFill()
    }
  }

  update(dt: number): void {
    for (const base of this.bases) {
      const ripple = this.rippleEffects.get(base.id)
      if (ripple && ripple.active) {
        ripple.phase += dt * 3
        if (ripple.phase >= 1) {
          ripple.active = false
          ripple.phase = 0
        }
      }
    }
  }

  getContainer(): PIXI.Container { return this.baseContainer }
}
