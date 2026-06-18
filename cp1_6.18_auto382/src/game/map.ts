export interface Tree {
  x: number
  y: number
  width: number
  height: number
}

export interface Rock {
  x: number
  y: number
  vertices: { x: number; y: number }[]
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
}

export interface Grass {
  x: number
  y: number
  size: number
}

export interface MapData {
  width: number
  height: number
  trees: Tree[]
  rocks: Rock[]
  grass: Grass[]
}

const MAP_WIDTH = 1000
const MAP_HEIGHT = 800

class PerlinNoise {
  private permutation: number[]

  constructor(seed = Math.random()) {
    this.permutation = []
    const p = []
    for (let i = 0; i < 256; i++) {
      p[i] = i
    }
    let s = seed * 10000
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647
      const j = Math.floor((s / 2147483647) * (i + 1))
      ;[p[i], p[j]] = [p[j], p[i]]
    }
    for (let i = 0; i < 512; i++) {
      this.permutation[i] = p[i & 255]
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a)
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3
    const u = h < 2 ? x : y
    const v = h < 2 ? y : x
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
  }

  noise(x: number, y: number): number {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    x -= Math.floor(x)
    y -= Math.floor(y)
    const u = this.fade(x)
    const v = this.fade(y)
    const A = this.permutation[X] + Y
    const B = this.permutation[X + 1] + Y
    return this.lerp(
      this.lerp(this.grad(this.permutation[A], x, y), this.grad(this.permutation[B], x - 1, y), u),
      this.lerp(this.grad(this.permutation[A + 1], x, y - 1), this.grad(this.permutation[B + 1], x - 1, y - 1), u),
      v
    )
  }
}

function generateRockVertices(cx: number, cy: number, baseSize: number): { x: number; y: number }[] {
  const vertexCount = 3 + Math.floor(Math.random() * 3)
  const vertices: { x: number; y: number }[] = []
  for (let i = 0; i < vertexCount; i++) {
    const angle = (i / vertexCount) * Math.PI * 2 + Math.random() * 0.5
    const radius = baseSize * (0.6 + Math.random() * 0.6)
    vertices.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    })
  }
  return vertices
}

function computeRockBounds(vertices: { x: number; y: number }[]) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const v of vertices) {
    if (v.x < minX) minX = v.x
    if (v.x > maxX) maxX = v.x
    if (v.y < minY) minY = v.y
    if (v.y > maxY) maxY = v.y
  }
  return { minX, maxX, minY, maxY }
}

export function generateMap(): MapData {
  const perlin = new PerlinNoise()
  const trees: Tree[] = []
  const rocks: Rock[] = []
  const grass: Grass[] = []

  for (let y = 40; y < MAP_HEIGHT - 40; y += 30) {
    for (let x = 40; x < MAP_WIDTH - 40; x += 30) {
      const noiseVal = perlin.noise(x * 0.01, y * 0.01)
      if (noiseVal > 0.35 && Math.random() < 0.35) {
        const tw = 18 + Math.random() * 12
        const th = 35 + Math.random() * 25
        trees.push({ x: x - tw / 2, y: y - th / 2, width: tw, height: th })
      } else if (noiseVal < -0.3 && Math.random() < 0.2) {
        const rockSize = 12 + Math.random() * 18
        const vertices = generateRockVertices(x, y, rockSize)
        rocks.push({ x, y, vertices, bounds: computeRockBounds(vertices) })
      } else if (Math.random() < 0.15) {
        grass.push({ x, y, size: 8 + Math.random() * 12 })
      }
    }
  }

  return { width: MAP_WIDTH, height: MAP_HEIGHT, trees, rocks, grass }
}

export function isCollidingRect(
  x: number,
  y: number,
  w: number,
  h: number,
  mapData: MapData
): boolean {
  for (const tree of mapData.trees) {
    if (
      x < tree.x + tree.width &&
      x + w > tree.x &&
      y < tree.y + tree.height &&
      y + h > tree.y
    ) {
      return true
    }
  }
  for (const rock of mapData.rocks) {
    const b = rock.bounds
    if (x < b.maxX && x + w > b.minX && y < b.maxY && y + h > b.minY) {
      if (pointInPolygon(x + w / 2, y + h / 2, rock.vertices)) {
        return true
      }
    }
  }
  return false
}

function pointInPolygon(px: number, py: number, vertices: { x: number; y: number }[]): boolean {
  let inside = false
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x, yi = vertices[i].y
    const xj = vertices[j].x, yj = vertices[j].y
    if (((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  return inside
}

export function circleCollidesWithMap(
  cx: number,
  cy: number,
  radius: number,
  mapData: MapData
): boolean {
  for (const tree of mapData.trees) {
    const closestX = Math.max(tree.x, Math.min(cx, tree.x + tree.width))
    const closestY = Math.max(tree.y, Math.min(cy, tree.y + tree.height))
    const dx = cx - closestX
    const dy = cy - closestY
    if (dx * dx + dy * dy < radius * radius) {
      return true
    }
  }
  for (const rock of mapData.rocks) {
    const b = rock.bounds
    const closestX = Math.max(b.minX, Math.min(cx, b.maxX))
    const closestY = Math.max(b.minY, Math.min(cy, b.maxY))
    const dx = cx - closestX
    const dy = cy - closestY
    if (dx * dx + dy * dy < radius * radius) {
      if (pointInPolygon(cx, cy, rock.vertices)) {
        return true
      }
    }
  }
  return false
}
