import { Point, GRID_SIZE, BLOCK_SIZE, ROAD_WIDTH, CANVAS_PADDING, getCrossroadCenter } from '../../types'

interface PathNode {
  x: number
  y: number
  g: number
  h: number
  f: number
  parent: PathNode | null
}

const getRoadGridSize = () => GRID_SIZE + 1

const worldToGrid = (x: number, y: number): { gx: number; gy: number } => {
  const gx = Math.floor((x - CANVAS_PADDING) / (BLOCK_SIZE + ROAD_WIDTH))
  const gy = Math.floor((y - CANVAS_PADDING) / (BLOCK_SIZE + ROAD_WIDTH))
  return { gx: Math.max(0, Math.min(getRoadGridSize() - 1, gx)), gy: Math.max(0, Math.min(getRoadGridSize() - 1, gy)) }
}

const gridToWorld = (gx: number, gy: number): Point => {
  const x = CANVAS_PADDING + ROAD_WIDTH / 2 + gx * (BLOCK_SIZE + ROAD_WIDTH)
  const y = CANVAS_PADDING + ROAD_WIDTH / 2 + gy * (BLOCK_SIZE + ROAD_WIDTH)
  return { x, y }
}

const heuristic = (a: PathNode, b: PathNode): number => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

const getNeighbors = (node: PathNode): PathNode[] => {
  const dirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ]
  const result: PathNode[] = []
  const size = getRoadGridSize()
  for (const dir of dirs) {
    const nx = node.x + dir.dx
    const ny = node.y + dir.dy
    if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
      result.push({ x: nx, y: ny, g: 0, h: 0, f: 0, parent: null })
    }
  }
  return result
}

export const findVehiclePath = (start: Point, end: Point): Point[] => {
  const startGrid = worldToGrid(start.x, start.y)
  const endGrid = worldToGrid(end.x, end.y)

  if (startGrid.gx === endGrid.gx && startGrid.gy === endGrid.gy) {
    return [start, end]
  }

  const openList: PathNode[] = []
  const closedSet = new Set<string>()

  const startNode: PathNode = {
    x: startGrid.gx,
    y: startGrid.gy,
    g: 0,
    h: 0,
    f: 0,
    parent: null,
  }
  openList.push(startNode)

  const endNode: PathNode = { x: endGrid.gx, y: endGrid.gy, g: 0, h: 0, f: 0, parent: null }

  let iterations = 0
  const maxIterations = 1000

  while (openList.length > 0 && iterations < maxIterations) {
    iterations++
    openList.sort((a, b) => a.f - b.f)
    const current = openList.shift()!

    if (current.x === endNode.x && current.y === endNode.y) {
      const path: Point[] = []
      let node: PathNode | null = current
      while (node) {
        path.unshift(gridToWorld(node.x, node.y))
        node = node.parent
      }
      path[0] = start
      path[path.length - 1] = end
      return path
    }

    closedSet.add(`${current.x},${current.y}`)

    for (const neighbor of getNeighbors(current)) {
      const key = `${neighbor.x},${neighbor.y}`
      if (closedSet.has(key)) continue

      const tentativeG = current.g + 1
      const existing = openList.find((n) => n.x === neighbor.x && n.y === neighbor.y)

      if (!existing || tentativeG < existing.g) {
        neighbor.g = tentativeG
        neighbor.h = heuristic(neighbor, endNode)
        neighbor.f = neighbor.g + neighbor.h
        neighbor.parent = current
        if (!existing) {
          openList.push(neighbor)
        }
      }
    }
  }

  return [start, end]
}

export const findPedestrianPath = (start: Point, end: Point): Point[] => {
  const startGrid = worldToGrid(start.x, start.y)
  const endGrid = worldToGrid(end.x, end.y)

  const path: Point[] = [start]

  const crossroadA = getCrossroadCenter(
    Math.max(0, Math.min(GRID_SIZE - 1, startGrid.gx)),
    Math.max(0, Math.min(GRID_SIZE - 1, startGrid.gy))
  )
  const crossroadB = getCrossroadCenter(
    Math.max(0, Math.min(GRID_SIZE - 1, endGrid.gx)),
    Math.max(0, Math.min(GRID_SIZE - 1, endGrid.gy))
  )

  const midPoint = {
    x: (crossroadA.x + crossroadB.x) / 2,
    y: (crossroadA.y + crossroadB.y) / 2,
  }

  if (Math.abs(startGrid.gx - endGrid.gx) + Math.abs(startGrid.gy - endGrid.gy) > 1) {
    path.push(crossroadA)
    path.push(midPoint)
    path.push(crossroadB)
  } else {
    path.push(midPoint)
  }

  path.push(end)
  return path
}
