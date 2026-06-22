import { v4 as uuidv4 } from 'uuid'

export type TerrainType = 'forest' | 'canyon' | 'waterfall' | 'volcano'
export type WindType = 'updraft' | 'downdraft' | 'tailwind'

export interface WindZone {
  id: string
  type: WindType
  x: number
  y: number
  width: number
  height: number
  strength: number
}

export interface Firefly {
  id: string
  x: number
  y: number
  baseY: number
  phase: number
  frequency: number
  collected: boolean
  attracting: boolean
}

export interface TerrainSegment {
  id: string
  startX: number
  endX: number
  type: TerrainType
  topHeights: number[]
  bottomHeights: number[]
  windZones: WindZone[]
  fireflies: Firefly[]
}

export const TERRAIN_CONFIG: Record<TerrainType, {
  name: string
  topBase: number
  topVariance: number
  bottomBase: number
  bottomVariance: number
  colors: { sky: string; mid: string; fore: string }
}> = {
  forest: {
    name: '森林',
    topBase: 40,
    topVariance: 30,
    bottomBase: 520,
    bottomVariance: 40,
    colors: { sky: '#87CEEB', mid: '#228B22', fore: '#006400' },
  },
  canyon: {
    name: '峡谷',
    topBase: 20,
    topVariance: 10,
    bottomBase: 560,
    bottomVariance: 80,
    colors: { sky: '#DEB887', mid: '#CD853F', fore: '#8B4513' },
  },
  waterfall: {
    name: '瀑布',
    topBase: 30,
    topVariance: 20,
    bottomBase: 540,
    bottomVariance: 30,
    colors: { sky: '#ADD8E6', mid: '#4682B4', fore: '#1E90FF' },
  },
  volcano: {
    name: '火山口',
    topBase: 50,
    topVariance: 60,
    bottomBase: 500,
    bottomVariance: 100,
    colors: { sky: '#FF6347', mid: '#B22222', fore: '#8B0000' },
  },
}

const SEGMENT_WIDTH = 1200
const HEIGHT_SAMPLES = 60

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function generateHeights(
  base: number,
  variance: number,
  startSeed: number,
  smoothness: number = 8,
): number[] {
  const heights: number[] = []
  for (let i = 0; i < HEIGHT_SAMPLES; i++) {
    const seed = startSeed + i * 0.1
    const noise1 = seededRandom(seed)
    const noise2 = seededRandom(seed * 2.3 + 100)
    const noise3 = seededRandom(seed * 5.7 + 500)
    const combined = (noise1 + noise2 * 0.5 + noise3 * 0.25) / 1.75
    heights.push(base + (combined - 0.5) * variance * 2)
  }
  
  const smoothed: number[] = []
  for (let i = 0; i < HEIGHT_SAMPLES; i++) {
    let sum = 0
    let count = 0
    for (let j = Math.max(0, i - smoothness); j <= Math.min(HEIGHT_SAMPLES - 1, i + smoothness); j++) {
      const weight = 1 - Math.abs(i - j) / (smoothness + 1)
      sum += heights[j] * weight
      count += weight
    }
    smoothed.push(sum / count)
  }
  return smoothed
}

function generateWindZones(startX: number, type: TerrainType, seed: number): WindZone[] {
  const zones: WindZone[] = []
  const count = 2 + Math.floor(seededRandom(seed) * 3)
  
  for (let i = 0; i < count; i++) {
    const r = seededRandom(seed * 10 + i)
    const r2 = seededRandom(seed * 20 + i + 50)
    const r3 = seededRandom(seed * 30 + i + 100)
    
    let windType: WindType
    if (type === 'volcano') {
      windType = r < 0.6 ? 'updraft' : r < 0.85 ? 'downdraft' : 'tailwind'
    } else if (type === 'waterfall') {
      windType = r < 0.4 ? 'updraft' : r < 0.6 ? 'downdraft' : 'tailwind'
    } else {
      windType = r < 0.35 ? 'updraft' : r < 0.55 ? 'downdraft' : 'tailwind'
    }
    
    const x = startX + 100 + r * (SEGMENT_WIDTH - 300)
    const y = 100 + r2 * 350
    const width = windType === 'tailwind' ? 250 + r3 * 200 : 120 + r3 * 100
    const height = windType === 'tailwind' ? 150 + r2 * 100 : 180 + r3 * 120
    const strength = 0.5 + seededRandom(seed * 40 + i) * 0.5
    
    zones.push({
      id: uuidv4(),
      type: windType,
      x,
      y,
      width,
      height,
      strength,
    })
  }
  return zones
}

function generateFireflies(startX: number, seed: number): Firefly[] {
  const fireflies: Firefly[] = []
  const clusters = 3 + Math.floor(seededRandom(seed) * 3)
  
  for (let c = 0; c < clusters; c++) {
    const clusterX = startX + 150 + seededRandom(seed * 15 + c) * (SEGMENT_WIDTH - 300)
    const clusterY = 150 + seededRandom(seed * 25 + c + 30) * 300
    const count = 3 + Math.floor(seededRandom(seed * 35 + c + 60) * 6)
    
    for (let i = 0; i < count; i++) {
      const r = seededRandom(seed * 100 + c * 10 + i)
      const r2 = seededRandom(seed * 200 + c * 10 + i + 50)
      fireflies.push({
        id: uuidv4(),
        x: clusterX + (r - 0.5) * 120,
        y: clusterY + (r2 - 0.5) * 80,
        baseY: clusterY + (r2 - 0.5) * 80,
        phase: seededRandom(seed * 300 + i + c * 7) * Math.PI * 2,
        frequency: 0.5 + seededRandom(seed * 400 + i) * 1.0,
        collected: false,
        attracting: false,
      })
    }
  }
  return fireflies
}

export function generateSegment(startX: number, seed: number): TerrainSegment {
  const types: TerrainType[] = ['forest', 'canyon', 'waterfall', 'volcano']
  const typeIdx = Math.floor(seededRandom(seed) * types.length)
  const type = types[typeIdx]
  const config = TERRAIN_CONFIG[type]
  
  const topHeights = generateHeights(config.topBase, config.topVariance, seed)
  const bottomHeights = generateHeights(config.bottomBase, config.bottomVariance, seed + 1000)
  const windZones = generateWindZones(startX, type, seed + 2000)
  const fireflies = generateFireflies(startX, seed + 3000)
  
  return {
    id: uuidv4(),
    startX,
    endX: startX + SEGMENT_WIDTH,
    type,
    topHeights,
    bottomHeights,
    windZones,
    fireflies,
  }
}

export function getTerrainHeightAt(segments: TerrainSegment[], x: number, isTop: boolean): number {
  for (const seg of segments) {
    if (x >= seg.startX && x < seg.endX) {
      const localX = (x - seg.startX) / (seg.endX - seg.startX)
      const idx = Math.floor(localX * HEIGHT_SAMPLES)
      const heights = isTop ? seg.topHeights : seg.bottomHeights
      if (idx >= 0 && idx < HEIGHT_SAMPLES) {
        return heights[idx]
      }
    }
  }
  return isTop ? 0 : 600
}
