import type { MapData, PathPoint } from '../../types'
import { TerrainType } from '../../types'

interface PriorityNode {
  x: number
  y: number
  g: number
  f: number
  parent: PriorityNode | null
}

class MinHeap {
  private data: PriorityNode[] = []

  private parent(i: number): number {
    return Math.floor((i - 1) / 2)
  }

  private left(i: number): number {
    return 2 * i + 1
  }

  private right(i: number): number {
    return 2 * i + 2
  }

  private swap(i: number, j: number): void {
    ;[this.data[i], this.data[j]] = [this.data[j], this.data[i]]
  }

  private heapifyDown(): void {
    let i = 0
    const n = this.data.length
    while (true) {
      const l = this.left(i)
      const r = this.right(i)
      let smallest = i
      if (l < n && this.data[l].f < this.data[smallest].f) smallest = l
      if (r < n && this.data[r].f < this.data[smallest].f) smallest = r
      if (smallest === i) break
      this.swap(i, smallest)
      i = smallest
    }
  }

  private heapifyUp(): void {
    let i = this.data.length - 1
    while (i > 0) {
      const p = this.parent(i)
      if (this.data[p].f > this.data[i].f) {
        this.swap(p, i)
        i = p
      } else {
        break
      }
    }
  }

  push(node: PriorityNode): void {
    this.data.push(node)
    this.heapifyUp()
  }

  pop(): PriorityNode | undefined {
    if (this.data.length === 0) return undefined
    const top = this.data[0]
    const last = this.data.pop()!
    if (this.data.length > 0) {
      this.data[0] = last
      this.heapifyDown()
    }
    return top
  }

  size(): number {
    return this.data.length
  }
}

export class RoutePlanner {
  private mapData: MapData

  constructor(mapData: MapData) {
    this.mapData = mapData
  }

  private getCost(x: number, y: number): number {
    if (!this.mapData.cells[y] || !this.mapData.cells[y][x]) return Infinity
    const cell = this.mapData.cells[y][x]
    if (cell.type === TerrainType.WATER && !cell.isRiver) return Infinity
    if (cell.type === TerrainType.MOUNTAIN) return 4
    if (cell.type === TerrainType.FOREST) return 1.5
    if (cell.isRiver) return 1.8
    return 1
  }

  private heuristic(x1: number, y1: number, x2: number, y2: number): number {
    const dx = Math.abs(x1 - x2)
    const dy = Math.abs(y1 - y2)
    return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy)
  }

  private isWalkable(x: number, y: number): boolean {
    if (x < 0 || x >= this.mapData.width || y < 0 || y >= this.mapData.height) return false
    const cell = this.mapData.cells[y][x]
    if (cell.type === TerrainType.WATER && !cell.isRiver) return false
    return true
  }

  findPath(startX: number, startY: number, endX: number, endY: number): PathPoint[] {
    const startTime = performance.now()

    if (!this.isWalkable(endX, endY)) {
      const neighbors = [
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: 1, dy: 1 },
      ]
      for (const n of neighbors) {
        const nx = endX + n.dx
        const ny = endY + n.dy
        if (this.isWalkable(nx, ny)) {
          return this.findPath(startX, startY, nx, ny)
        }
      }
      return []
    }

    if (!this.isWalkable(startX, startY)) {
      const neighbors = [
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
      ]
      for (const n of neighbors) {
        const nx = startX + n.dx
        const ny = startY + n.dy
        if (this.isWalkable(nx, ny)) {
          return this.findPath(nx, ny, endX, endY)
        }
      }
      return []
    }

    const openSet = new MinHeap()
    const key = (x: number, y: number) => `${x},${y}`
    const gScore = new Map<string, number>()
    const nodes = new Map<string, PriorityNode>()

    const startNode: PriorityNode = {
      x: startX,
      y: startY,
      g: 0,
      f: this.heuristic(startX, startY, endX, endY),
      parent: null,
    }
    openSet.push(startNode)
    gScore.set(key(startX, startY), 0)
    nodes.set(key(startX, startY), startNode)

    const neighbors = [
      { dx: -1, dy: 0, cost: 1 },
      { dx: 1, dy: 0, cost: 1 },
      { dx: 0, dy: -1, cost: 1 },
      { dx: 0, dy: 1, cost: 1 },
      { dx: -1, dy: -1, cost: 1.414 },
      { dx: 1, dy: -1, cost: 1.414 },
      { dx: -1, dy: 1, cost: 1.414 },
      { dx: 1, dy: 1, cost: 1.414 },
    ]

    const maxIterations = this.mapData.width * this.mapData.height * 4
    let iterations = 0
    let endNode: PriorityNode | null = null

    while (openSet.size() > 0 && iterations < maxIterations) {
      iterations++
      const current = openSet.pop()!
      if (current.x === endX && current.y === endY) {
        endNode = current
        break
      }

      for (const n of neighbors) {
        const nx = current.x + n.dx
        const ny = current.y + n.dy
        if (!this.isWalkable(nx, ny)) continue
        if (n.dx !== 0 && n.dy !== 0) {
          if (!this.isWalkable(current.x + n.dx, current.y) ||
              !this.isWalkable(current.x, current.y + n.dy)) continue
        }
        const cellCost = this.getCost(nx, ny)
        if (cellCost === Infinity) continue
        const tentativeG = current.g + n.cost * cellCost
        const k = key(nx, ny)
        if (!gScore.has(k) || tentativeG < gScore.get(k)!) {
          gScore.set(k, tentativeG)
          const h = this.heuristic(nx, ny, endX, endY)
          const neighborNode: PriorityNode = {
            x: nx,
            y: ny,
            g: tentativeG,
            f: tentativeG + h,
            parent: current,
          }
          openSet.push(neighborNode)
          nodes.set(k, neighborNode)
        }
      }
    }

    const path: PathPoint[] = []
    if (endNode) {
      let cur: PriorityNode | null = endNode
      while (cur) {
        path.push({ x: cur.x, y: cur.y })
        cur = cur.parent
      }
      path.reverse()
    }

    const elapsed = performance.now() - startTime
    if (elapsed > 200) {
      console.warn(`路径规划耗时 ${elapsed.toFixed(0)}ms，超过200ms目标`)
    }

    return path
  }
}

export function planRoute(
  mapData: MapData,
  start: PathPoint,
  end: PathPoint
): PathPoint[] {
  const planner = new RoutePlanner(mapData)
  return planner.findPath(start.x, start.y, end.x, end.y)
}
