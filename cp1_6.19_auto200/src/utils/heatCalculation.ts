export interface Building {
  id: string
  position: [number, number, number]
  height: number
  width: number
  depth: number
  baseTemp: number
  hasGreenRoof: boolean
  hasVerticalGreening: boolean
}

export interface HeatGridPoint {
  x: number
  z: number
  temperature: number
  color: string
}

export interface MitigationState {
  greenRoof: boolean
  verticalGreening: boolean
  permeablePavement: boolean
}

const MIN_TEMP = 25
const MAX_TEMP = 45

function lerpColor(color1: number[], color2: number[], t: number): number[] {
  return [
    Math.round(color1[0] + (color2[0] - color1[0]) * t),
    Math.round(color1[1] + (color2[1] - color1[1]) * t),
    Math.round(color1[2] + (color2[2] - color1[2]) * t),
  ]
}

function rgbToString(rgb: number[]): string {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
}

const COLOR_STOPS: { temp: number; color: number[] }[] = [
  { temp: 25, color: [0, 0, 255] },
  { temp: 30, color: [0, 255, 255] },
  { temp: 35, color: [255, 255, 0] },
  { temp: 40, color: [255, 128, 0] },
  { temp: 45, color: [255, 0, 0] },
]

export function tempToColor(temp: number): string {
  const clamped = Math.max(MIN_TEMP, Math.min(MAX_TEMP, temp))
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const stop1 = COLOR_STOPS[i]
    const stop2 = COLOR_STOPS[i + 1]
    if (clamped >= stop1.temp && clamped <= stop2.temp) {
      const t = (clamped - stop1.temp) / (stop2.temp - stop1.temp)
      return rgbToString(lerpColor(stop1.color, stop2.color, t))
    }
  }
  return rgbToString(COLOR_STOPS[COLOR_STOPS.length - 1].color)
}

export function hexToRgb(hex: string): number[] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [128, 128, 128]
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function generateBuildings(
  density: number,
  albedo: number,
  zoneId: string
): Building[] {
  const buildings: Building[] = []
  const gridSize = 10
  const spacing = 2
  const densityFactor = density / 100
  const buildingCount = Math.floor(15 + densityFactor * 25)
  
  const seed = zoneId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  let random = seed
  
  const nextRandom = () => {
    random = (random * 9301 + 49297) % 233280
    return random / 233280
  }

  const placedPositions: Set<string> = new Set()

  for (let i = 0; i < buildingCount; i++) {
    let attempts = 0
    while (attempts < 50) {
      const gx = Math.floor(nextRandom() * gridSize) - gridSize / 2
      const gz = Math.floor(nextRandom() * gridSize) - gridSize / 2
      const key = `${gx},${gz}`
      
      if (!placedPositions.has(key)) {
        placedPositions.add(key)
        const height = 5 + nextRandom() * 15
        const width = 1.5 + nextRandom() * 1.5
        const depth = 1.5 + nextRandom() * 1.5
        
        buildings.push({
          id: `building-${zoneId}-${i}`,
          position: [gx * spacing, height / 2, gz * spacing],
          height,
          width,
          depth,
          baseTemp: 25 + densityFactor * 12 + nextRandom() * 3,
          hasGreenRoof: false,
          hasVerticalGreening: false,
        })
        break
      }
      attempts++
    }
  }

  return buildings
}

export function calculateHeatData(
  buildings: Building[],
  buildingDensity: number,
  vegetationCoverage: number,
  materialAlbedo: number,
  mitigations: MitigationState
): { grid: HeatGridPoint[]; buildings: Building[]; stats: { avgTemp: number; maxTemp: number; minTemp: number; tempReduction: number } } {
  const gridSize = 16
  const gridStep = 1.5
  const halfSize = (gridSize - 1) / 2 * gridStep
  
  const densityFactor = buildingDensity / 100
  const vegFactor = vegetationCoverage / 100
  const albedoFactor = (materialAlbedo - 0.1) / 0.8
  
  const baseTemp = 25 + densityFactor * 15 - vegFactor * 5 - albedoFactor * 3
  
  const grid: HeatGridPoint[] = []
  const temps: number[] = []
  
  const updatedBuildings = buildings.map((b) => ({
    ...b,
    hasGreenRoof: mitigations.greenRoof,
    hasVerticalGreening: mitigations.verticalGreening,
  }))

  for (let ix = 0; ix < gridSize; ix++) {
    for (let iz = 0; iz < gridSize; iz++) {
      const x = (ix - gridSize / 2 + 0.5) * gridStep
      const z = (iz - gridSize / 2 + 0.5) * gridStep
      
      let buildingHeat = 0
      let nearestDist = Infinity
      
      for (const building of updatedBuildings) {
        const bx = building.position[0]
        const bz = building.position[2]
        const dist = Math.sqrt((x - bx) ** 2 + (z - bz) ** 2)
        const heatRadius = 4
        if (dist < heatRadius) {
          const influence = 1 - dist / heatRadius
          buildingHeat += building.baseTemp * 0.1 * influence
        }
        if (dist < nearestDist) nearestDist = dist
      }
      
      let temp = baseTemp + buildingHeat
      
      if (mitigations.greenRoof) temp -= densityFactor * 1.5
      if (mitigations.verticalGreening) temp -= densityFactor * 1.0
      if (mitigations.permeablePavement) temp -= vegFactor * 1.5
      
      temp = Math.max(MIN_TEMP, Math.min(MAX_TEMP, temp))
      temps.push(temp)
      
      grid.push({
        x,
        z,
        temperature: temp,
        color: tempToColor(temp),
      })
    }
  }
  
  const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length
  const maxTemp = Math.max(...temps)
  const minTemp = Math.min(...temps)
  
  const baselineAvg = 25 + densityFactor * 15 - vegFactor * 5 - albedoFactor * 3 + densityFactor * 2
  const tempReduction = baselineAvg - avgTemp
  
  return {
    grid,
    buildings: updatedBuildings,
    stats: {
      avgTemp: Math.round(avgTemp * 10) / 10,
      maxTemp: Math.round(maxTemp * 10) / 10,
      minTemp: Math.round(minTemp * 10) / 10,
      tempReduction: Math.round(tempReduction * 10) / 10,
    },
  }
}

export function generateParticleData(buildings: Building[], count: number): {
  positions: Float32Array
  colors: Float32Array
  speeds: Float32Array
  offsets: Float32Array
} {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const speeds = new Float32Array(count)
  const offsets = new Float32Array(count)
  
  for (let i = 0; i < count; i++) {
    const buildingIndex = Math.floor(Math.random() * buildings.length)
    const building = buildings[buildingIndex] || {
      position: [0, 0, 0],
      height: 5,
      width: 1,
      depth: 1,
      baseTemp: 30,
    }
    
    const bx = building.position[0]
    const by = building.height
    const bz = building.position[2]
    const bw = building.width / 2
    const bd = building.depth / 2
    
    const px = bx + (Math.random() - 0.5) * bw * 2
    const py = by + Math.random() * 5
    const pz = bz + (Math.random() - 0.5) * bd * 2
    
    positions[i * 3] = px
    positions[i * 3 + 1] = py
    positions[i * 3 + 2] = pz
    
    const temp = building.baseTemp || 30
    const t = (temp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)
    const clampedT = Math.max(0, Math.min(1, t))
    
    const r = clampedT
    const g = 1 - Math.abs(clampedT - 0.5) * 2
    const b = 1 - clampedT
    
    colors[i * 3] = r
    colors[i * 3 + 1] = Math.max(0, g)
    colors[i * 3 + 2] = b
    
    speeds[i] = 0.3 + Math.random() * 0.5
    offsets[i] = Math.random() * Math.PI * 2
  }
  
  return { positions, colors, speeds, offsets }
}

export interface ZoneData {
  id: string
  name: string
  density: number
  vegetation: number
  albedo: number
}

export const ZONES: ZoneData[] = [
  { id: 'zone-1', name: '商业区', density: 85, vegetation: 10, albedo: 0.3 },
  { id: 'zone-2', name: '住宅区', density: 60, vegetation: 25, albedo: 0.4 },
  { id: 'zone-3', name: '工业区', density: 70, vegetation: 5, albedo: 0.2 },
  { id: 'zone-4', name: '公园区', density: 20, vegetation: 80, albedo: 0.5 },
  { id: 'zone-5', name: '老城区', density: 75, vegetation: 15, albedo: 0.25 },
  { id: 'zone-6', name: '新城区', density: 55, vegetation: 35, albedo: 0.5 },
  { id: 'zone-7', name: '交通枢纽', density: 45, vegetation: 10, albedo: 0.15 },
  { id: 'zone-8', name: '校园区', density: 40, vegetation: 50, albedo: 0.45 },
  { id: 'zone-9', name: '滨水区', density: 30, vegetation: 45, albedo: 0.55 },
]
