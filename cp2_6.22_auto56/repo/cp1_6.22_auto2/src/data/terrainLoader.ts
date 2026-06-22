import type { ElevationResponse, GeoSearchResult } from '@/types'

const SIMPLEX_GRAD3 = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
]

class SimplexNoise {
  private perm: number[]

  constructor(seed = 0) {
    const p: number[] = []
    for (let i = 0; i < 256; i++) p[i] = i
    let n = seed
    for (let i = 255; i > 0; i--) {
      n = (n * 16807 + 0) % 2147483647
      const j = n % (i + 1)
      ;[p[i], p[j]] = [p[j], p[i]]
    }
    this.perm = [...p, ...p]
  }

  noise2D(xin: number, yin: number): number {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0)
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0
    const s = (xin + yin) * F2
    const i = Math.floor(xin + s)
    const j = Math.floor(yin + s)
    const t = (i + j) * G2
    const X0 = i - t
    const Y0 = j - t
    const x0 = xin - X0
    const y0 = yin - Y0
    let i1: number, j1: number
    if (x0 > y0) { i1 = 1; j1 = 0 } else { i1 = 0; j1 = 1 }
    const x1 = x0 - i1 + G2
    const y1 = y0 - j1 + G2
    const x2 = x0 - 1.0 + 2.0 * G2
    const y2 = y0 - 1.0 + 2.0 * G2
    const ii = i & 255
    const jj = j & 255
    const dot = (g: number[], x: number, y: number) => g[0] * x + g[1] * y
    let n0 = 0, n1 = 0, n2 = 0
    let t0 = 0.5 - x0 * x0 - y0 * y0
    if (t0 >= 0) {
      t0 *= t0
      const gi0 = this.perm[ii + this.perm[jj]] % 12
      n0 = t0 * t0 * dot(SIMPLEX_GRAD3[gi0], x0, y0)
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1
    if (t1 >= 0) {
      t1 *= t1
      const gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12
      n1 = t1 * t1 * dot(SIMPLEX_GRAD3[gi1], x1, y1)
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2
    if (t2 >= 0) {
      t2 *= t2
      const gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12
      n2 = t2 * t2 * dot(SIMPLEX_GRAD3[gi2], x2, y2)
    }
    return 70.0 * (n0 + n1 + n2)
  }
}

const noise = new SimplexNoise(42)
const noise2 = new SimplexNoise(137)

function fbm(x: number, y: number, octaves: number): number {
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxValue = 0
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise.noise2D(x * frequency, y * frequency)
    maxValue += amplitude
    amplitude *= 0.5
    frequency *= 2.0
  }
  return value / maxValue
}

function getElevation(lat: number, lon: number): number {
  const nx = lon / 180
  const ny = lat / 90
  let elevation = fbm(nx * 3, ny * 3, 6) * 3000
  const mountainFactor = noise2.noise2D(nx * 2, ny * 2)
  if (mountainFactor > 0.2) {
    elevation += mountainFactor * 4000
  }
  const oceanFactor = fbm(nx * 1.5 + 10, ny * 1.5 + 10, 4)
  if (oceanFactor < -0.1) {
    elevation = -500 - Math.abs(oceanFactor) * 2000
  }
  return elevation
}

export async function fetchElevationData(
  lat: number,
  lon: number,
  resolution: number,
  _onProgress?: (pct: number) => void,
): Promise<ElevationResponse> {
  await new Promise<void>(resolve => setTimeout(resolve, 300))
  const size = resolution
  const elevations: number[] = new Array(size * size)
  const step = 1.0 / (size - 1)
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const sampleLat = lat + row * step
      const sampleLon = lon + col * step
      elevations[row * size + col] = getElevation(sampleLat, sampleLon)
    }
    if (_onProgress && row % 64 === 0) {
      _onProgress(Math.round((row / size) * 100))
      await new Promise<void>(resolve => setTimeout(resolve, 0))
    }
  }
  if (_onProgress) _onProgress(100)
  return { lat, lon, width: size, height: size, elevations }
}

export async function searchCity(query: string): Promise<GeoSearchResult[]> {
  if (!query || query.length < 2) return []
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=8&accept-language=zh,en`
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'GeoTerrain3D/1.0' },
    })
    if (!resp.ok) return []
    const data = await resp.json() as Array<{
      display_name: string
      lat: string
      lon: string
      name?: string
    }>
    return data.map(item => ({
      name: item.name || item.display_name.split(',')[0],
      country: item.display_name.split(',').pop()?.trim() || '',
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      displayName: item.display_name,
    }))
  } catch {
    return []
  }
}
