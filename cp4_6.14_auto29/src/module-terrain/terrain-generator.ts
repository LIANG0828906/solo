import { TerrainData, ResourcePoint, ResourceType } from '../types'
import { v4 as uuidv4 } from 'uuid'

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function perlinNoise2D(x: number, y: number, seed: number = 0): number {
  const random = seededRandom(Math.floor(x * 1000 + y * 10000 + seed * 100000) >>> 0)
  const corners = [random(), random(), random(), random()]
  
  const sx = x - Math.floor(x)
  const sy = y - Math.floor(y)
  
  const fade = (t: number) => t * t * (3 - 2 * t)
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  
  const u = fade(sx)
  const v = fade(sy)
  
  const a = lerp(corners[0], corners[1], u)
  const b = lerp(corners[2], corners[3], u)
  
  return lerp(a, b, v) * 2 - 1
}

function octaveNoise(x: number, y: number, octaves: number = 4, persistence: number = 0.5, seed: number = 0): number {
  let total = 0
  let frequency = 1
  let amplitude = 1
  let maxValue = 0
  
  for (let i = 0; i < octaves; i++) {
    total += perlinNoise2D(x * frequency, y * frequency, seed + i) * amplitude
    maxValue += amplitude
    amplitude *= persistence
    frequency *= 2
  }
  
  return total / maxValue
}

export function generateTerrain(chunkX: number, chunkZ: number, size: number = 20): TerrainData {
  const seed = chunkX * 1000 + chunkZ
  const vertices: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const heights: number[][] = []
  const segments = size
  
  for (let z = 0; z <= segments; z++) {
    heights[z] = []
    for (let x = 0; x <= segments; x++) {
      const worldX = (x - segments / 2) + chunkX * size
      const worldZ = (z - segments / 2) + chunkZ * size
      
      let height = octaveNoise(worldX * 0.08, worldZ * 0.08, 4, 0.5, seed) * 2.5
      height += octaveNoise(worldX * 0.02, worldZ * 0.02, 2, 0.6, seed + 100) * 4
      height = Math.max(0, height)
      
      heights[z][x] = height
      
      vertices.push(
        x - segments / 2,
        height,
        z - segments / 2
      )
      
      uvs.push(x / segments, z / segments)
    }
  }
  
  for (let z = 0; z < segments; z++) {
    for (let x = 0; x < segments; x++) {
      const topLeft = z * (segments + 1) + x
      const topRight = topLeft + 1
      const bottomLeft = (z + 1) * (segments + 1) + x
      const bottomRight = bottomLeft + 1
      
      indices.push(topLeft, bottomLeft, topRight)
      indices.push(topRight, bottomLeft, bottomRight)
    }
  }
  
  return { vertices, uvs, indices, heights, size }
}

export function generateResourcePoints(
  terrainData: TerrainData,
  chunkX: number,
  chunkZ: number
): ResourcePoint[] {
  const seed = chunkX * 7777 + chunkZ * 3333 + 9999
  const random = seededRandom(Math.abs(seed) >>> 0)
  
  const resourceCount = Math.floor(random() * 5) + 8
  const resourceTypes: ResourceType[] = ['wood', 'stone', 'metal', 'food']
  const points: ResourcePoint[] = []
  const size = terrainData.size
  
  for (let i = 0; i < resourceCount; i++) {
    const gridX = Math.floor(random() * (size - 2)) + 1
    const gridZ = Math.floor(random() * (size - 2)) + 1
    
    if (gridZ >= terrainData.heights.length || gridX >= terrainData.heights[0].length) {
      continue
    }
    
    const height = terrainData.heights[gridZ][gridX]
    const type = resourceTypes[Math.floor(random() * resourceTypes.length)]
    
    const offsetX = random() - 0.5
    const offsetZ = random() - 0.5
    
    points.push({
      id: uuidv4(),
      type,
      position: {
        x: gridX - size / 2 + offsetX,
        y: height + 0.3,
        z: gridZ - size / 2 + offsetZ
      },
      collected: false
    })
  }
  
  return points
}

export function generateTerrainAsync(
  chunkX: number,
  chunkZ: number,
  size: number = 20
): Promise<{ terrain: TerrainData; resources: ResourcePoint[] }> {
  return new Promise((resolve) => {
    const start = performance.now()
    setTimeout(() => {
      const terrain = generateTerrain(chunkX, chunkZ, size)
      const resources = generateResourcePoints(terrain, chunkX, chunkZ)
      const elapsed = performance.now() - start
      if (elapsed < 16) {
        setTimeout(() => resolve({ terrain, resources }), 16 - elapsed)
      } else {
        resolve({ terrain, resources })
      }
    }, 0)
  })
}
