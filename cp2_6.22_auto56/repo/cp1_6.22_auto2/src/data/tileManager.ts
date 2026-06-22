import * as THREE from 'three'
import { fetchElevationData } from './terrainLoader'
import { tileKey, type LODLevel, LOD_RESOLUTIONS } from '@/types'
import { latLonToWorld } from '@/utils/geo'

interface CacheEntry {
  geometry: THREE.BufferGeometry
  lastAccess: number
}

const MAX_CACHE = 64
const cache = new Map<string, CacheEntry>()

function elevationToColor(elev: number): THREE.Color {
  const color = new THREE.Color()
  if (elev < 0) {
    color.setRGB(0.05, 0.15, 0.35)
  } else if (elev < 200) {
    const t = elev / 200
    color.setRGB(
      0.1 + t * 0.0,
      0.36 - t * 0.04,
      0.23 + t * 0.07,
    )
  } else if (elev < 1000) {
    const t = (elev - 200) / 800
    color.setRGB(
      0.1 + t * 0.35,
      0.32 - t * 0.08,
      0.3 - t * 0.18,
    )
  } else if (elev < 3000) {
    const t = (elev - 1000) / 2000
    color.setRGB(
      0.45 + t * 0.25,
      0.24 + t * 0.2,
      0.12 + t * 0.08,
    )
  } else {
    const t = Math.min((elev - 3000) / 3000, 1)
    color.setRGB(
      0.7 + t * 0.3,
      0.44 + t * 0.56,
      0.2 + t * 0.8,
    )
  }
  return color
}

export function buildGeometry(
  lat: number,
  lon: number,
  resolution: number,
  elevations: number[],
): THREE.BufferGeometry {
  const worldOrigin = latLonToWorld(lat, lon)
  const worldNext = latLonToWorld(lat, lon + 1)
  const worldNextLat = latLonToWorld(lat + 1, lon)
  const tileWorldW = worldNext.x - worldOrigin.x
  const tileWorldH = worldNextLat.z - worldOrigin.z

  const segX = resolution - 1
  const segY = resolution - 1
  const vertices: number[] = []
  const colors: number[] = []
  const normals: number[] = []
  const indices: number[] = []
  const heightScale = 0.005

  for (let iy = 0; iy < resolution; iy++) {
    for (let ix = 0; ix < resolution; ix++) {
      const u = ix / segX
      const v = iy / segY
      const elev = elevations[iy * resolution + ix]
      const x = worldOrigin.x + u * tileWorldW
      const z = worldOrigin.z + v * tileWorldH
      const y = elev * heightScale
      vertices.push(x, y, z)
      const c = elevationToColor(elev)
      colors.push(c.r, c.g, c.b)
    }
  }

  for (let iy = 0; iy < segY; iy++) {
    for (let ix = 0; ix < segX; ix++) {
      const a = iy * resolution + ix
      const b = a + 1
      const c = a + resolution
      const d = c + 1
      indices.push(a, c, b, b, c, d)
    }
  }

  for (let i = 0; i < vertices.length; i++) normals.push(0, 1, 0)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}

export function getLODForDistance(distance: number): LODLevel {
  if (distance < 50) return 0
  if (distance < 150) return 1
  if (distance < 300) return 2
  return 3
}

export async function getTileGeometry(
  lat: number,
  lon: number,
  lod: LODLevel,
  onProgress?: (pct: number) => void,
): Promise<THREE.BufferGeometry> {
  const key = tileKey(lat, lon, lod)
  const cached = cache.get(key)
  if (cached) {
    cached.lastAccess = Date.now()
    return cached.geometry
  }

  const resolution = LOD_RESOLUTIONS[lod]
  const data = await fetchElevationData(lat, lon, resolution, onProgress)
  const geometry = buildGeometry(lat, lon, resolution, data.elevations)

  if (cache.size >= MAX_CACHE) {
    let oldest = ''
    let oldestTime = Infinity
    for (const [k, v] of cache) {
      if (v.lastAccess < oldestTime) {
        oldestTime = v.lastAccess
        oldest = k
      }
    }
    if (oldest) {
      const old = cache.get(oldest)
      if (old) old.geometry.dispose()
      cache.delete(oldest)
    }
  }

  cache.set(key, { geometry, lastAccess: Date.now() })
  return geometry
}

export function clearCache(): void {
  for (const [, v] of cache) v.geometry.dispose()
  cache.clear()
}

export function countCachedVertices(): number {
  let total = 0
  for (const [, v] of cache) {
    const pos = v.geometry.getAttribute('position')
    if (pos) total += pos.count
  }
  return total
}
