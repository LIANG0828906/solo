import { Cell, CellType, FoodParticle, ToxinParticle } from './store'
import { v4 as uuidv4 } from 'uuid'

const DISH_RADIUS = 350
const DISH_CENTER = 350
const CELL_SIZE_THRESHOLD = 300

export interface CellBehaviorResult {
  cells: Cell[]
  newCells: Cell[]
  removedIds: string[]
  predationOccurred: boolean
}

interface SpatialHash {
  getNearbyCells: (x: number, y: number, radius: number) => Cell[]
}

class SpatialHashGrid implements SpatialHash {
  private grid: Map<string, Cell[]>
  private cellSize: number

  constructor(cellSize: number = 30) {
    this.cellSize = cellSize
    this.grid = new Map()
  }

  build(cells: Cell[]) {
    this.grid.clear()
    for (const cell of cells) {
      const key = this.getKey(cell.x, cell.y)
      if (!this.grid.has(key)) this.grid.set(key, [])
      this.grid.get(key)!.push(cell)
    }
  }

  private getKey(x: number, y: number): string {
    const gx = Math.floor(x / this.cellSize)
    const gy = Math.floor(y / this.cellSize)
    return `${gx},${gy}`
  }

  getNearbyCells(x: number, y: number, radius: number): Cell[] {
    const result: Cell[] = []
    const minGx = Math.floor((x - radius) / this.cellSize)
    const maxGx = Math.floor((x + radius) / this.cellSize)
    const minGy = Math.floor((y - radius) / this.cellSize)
    const maxGy = Math.floor((y + radius) / this.cellSize)
    for (let gx = minGx; gx <= maxGx; gx++) {
      for (let gy = minGy; gy <= maxGy; gy++) {
        const key = `${gx},${gy}`
        const bucket = this.grid.get(key)
        if (bucket) result.push(...bucket)
      }
    }
    return result
  }
}

export class CellBehaviorModule {
  private spatialGrid: SpatialHashGrid
  private useSpatialHash: boolean

  constructor() {
    this.spatialGrid = new SpatialHashGrid(30)
    this.useSpatialHash = false
  }

  getTemperatureSpeedMultiplier(temperature: number): number {
    if (temperature < 15) return 0
    return 1 + ((temperature - 50) / 10) * 0.5
  }

  getDivisionEnergyThreshold(temperature: number): number {
    return Math.max(1, 3 - ((temperature - 50) / 10) * 0.5)
  }

  moveCell(cell: Cell, temperature: number, food: FoodParticle[]): Cell {
    const newCell = { ...cell }

    if (temperature < 15) {
      newCell.isDormant = true
      return newCell
    }
    newCell.isDormant = false

    const speedMult = this.getTemperatureSpeedMultiplier(temperature)

    newCell.vx += (Math.random() - 0.5) * 0.4
    newCell.vy += (Math.random() - 0.5) * 0.4

    const maxSpeed = 2 * speedMult
    const currentSpeed = Math.sqrt(newCell.vx * newCell.vx + newCell.vy * newCell.vy)
    if (currentSpeed > maxSpeed) {
      newCell.vx = (newCell.vx / currentSpeed) * maxSpeed
      newCell.vy = (newCell.vy / currentSpeed) * maxSpeed
    }

    for (const f of food) {
      const dx = f.x - newCell.x
      const dy = f.y - newCell.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 60 && dist > 0) {
        newCell.vx += (dx / dist) * 0.05
        newCell.vy += (dy / dist) * 0.05
        if (dist < f.radius + newCell.radius) {
          newCell.flashTimer = 12
        }
      }
    }

    const baseSpeed = 1 * speedMult
    const mag = Math.sqrt(newCell.vx * newCell.vx + newCell.vy * newCell.vy)
    if (mag < baseSpeed) {
      newCell.vx = (newCell.vx / (mag || 1)) * baseSpeed
      newCell.vy = (newCell.vy / (mag || 1)) * baseSpeed
    }

    newCell.x += newCell.vx
    newCell.y += newCell.vy

    const dx = newCell.x - DISH_CENTER
    const dy = newCell.y - DISH_CENTER
    const dist = Math.sqrt(dx * dx + dy * dy)
    const maxDist = DISH_RADIUS - newCell.radius
    if (dist > maxDist) {
      const nx = dx / dist
      const ny = dy / dist
      newCell.x = DISH_CENTER + nx * maxDist
      newCell.y = DISH_CENTER + ny * maxDist
      const dot = newCell.vx * nx + newCell.vy * ny
      newCell.vx -= 2 * dot * nx
      newCell.vy -= 2 * dot * ny
      newCell.vx *= 0.8
      newCell.vy *= 0.8
    }

    newCell.rotation += 0.02

    if (newCell.flashTimer > 0) newCell.flashTimer--
    if (newCell.expandTimer > 0) newCell.expandTimer--

    return newCell
  }

  applyToxinDamage(cell: Cell, toxins: ToxinParticle[], deltaTime: number): Cell {
    const newCell = { ...cell }
    for (const t of toxins) {
      const dx = t.x - newCell.x
      const dy = t.y - newCell.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < t.radius + newCell.radius) {
        newCell.health -= 5 * deltaTime
      }
    }
    return newCell
  }

  checkAndHandlePredation(
    cells: Cell[]
  ): { survivors: Cell[]; newCells: Cell[]; removedIds: string[]; predationOccurred: boolean } {
    const survivors: Cell[] = [...cells]
    const newCells: Cell[] = []
    const removedIds: string[] = []
    let predationOccurred = false
    const toRemove = new Set<string>()

    this.useSpatialHash = survivors.length > CELL_SIZE_THRESHOLD
    if (this.useSpatialHash) {
      this.spatialGrid.build(survivors.filter((c) => !toRemove.has(c.id) && c.health > 0))
    }

    for (let i = 0; i < survivors.length; i++) {
      const a = survivors[i]
      if (toRemove.has(a.id) || a.health <= 0) continue

      let nearby: Cell[]
      if (this.useSpatialHash) {
        nearby = this.spatialGrid.getNearbyCells(a.x, a.y, 20).filter((c) => c.id !== a.id)
      } else {
        nearby = survivors.filter((c) => c.id !== a.id && !toRemove.has(c.id) && c.health > 0)
      }

      for (const b of nearby) {
        if (toRemove.has(b.id) || b.health <= 0) continue
        if (a.type === b.type) continue

        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 10) {
          let predator: Cell, prey: Cell
          if (a.radius >= b.radius) {
            predator = a
            prey = b
          } else {
            predator = b
            prey = a
          }

          if (Math.random() < 0.6 && !toRemove.has(prey.id)) {
            toRemove.add(prey.id)
            removedIds.push(prey.id)
            predationOccurred = true

            const predIdx = survivors.findIndex((c) => c.id === predator.id)
            if (predIdx !== -1) {
              survivors[predIdx] = {
                ...survivors[predIdx],
                energy: survivors[predIdx].energy + 1,
                expandTimer: 30
              }
            }
          }
        }
      }
    }

    const finalSurvivors = survivors.filter((c) => !toRemove.has(c.id))

    for (let i = 0; i < finalSurvivors.length; i++) {
      const c = finalSurvivors[i]
      if (c.health <= 0) continue
      const threshold = this.getDivisionEnergyThreshold(50)
      if (c.energy >= threshold) {
        finalSurvivors[i] = { ...c, energy: 0 }
        const angle = Math.random() * Math.PI * 2
        const newRadius = Math.max(4, c.radius * 0.5)
        const newCell: Cell = {
          id: uuidv4(),
          type: c.type,
          x: c.x + Math.cos(angle) * (c.radius + newRadius + 2),
          y: c.y + Math.sin(angle) * (c.radius + newRadius + 2),
          vx: Math.cos(angle) * 3,
          vy: Math.sin(angle) * 3,
          radius: newRadius,
          energy: 0,
          health: 100,
          isDormant: false,
          rotation: Math.random() * Math.PI * 2,
          flashTimer: 0,
          expandTimer: 0
        }
        newCells.push(newCell)
      }
    }

    return { survivors: finalSurvivors, newCells, removedIds, predationOccurred }
  }

  step(
    cells: Cell[],
    temperature: number,
    food: FoodParticle[],
    toxins: ToxinParticle[],
    deltaTime: number
  ): CellBehaviorResult {
    let processed = cells.map((c) => this.moveCell(c, temperature, food))
    processed = processed.map((c) => this.applyToxinDamage(c, toxins, deltaTime))

    const { survivors, newCells, removedIds, predationOccurred } =
      this.checkAndHandlePredation(processed)

    const finalRemoved = [...removedIds]
    const stillAlive: Cell[] = []
    for (const c of survivors) {
      if (c.health <= 0) {
        c.health = Math.max(0, c.health - deltaTime * 10)
        if (c.health <= -30) {
          finalRemoved.push(c.id)
        } else {
          stillAlive.push({ ...c, vx: 0, vy: 0 })
        }
      } else {
        stillAlive.push(c)
      }
    }

    return {
      cells: stillAlive.filter((c) => !finalRemoved.includes(c.id)),
      newCells,
      removedIds: finalRemoved,
      predationOccurred
    }
  }
}

export const cellBehavior = new CellBehaviorModule()
