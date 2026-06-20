export type BuildingType = 'commercial' | 'industrial' | 'residential' | 'park'

export interface BuildingData {
  id: string
  gridX: number
  gridZ: number
  x: number
  z: number
  type: BuildingType
  heat: number
  baseHeat: number
  brightnessBoost: number
}

export interface PulseData {
  id: string
  x: number
  z: number
  originGridX: number
  originGridZ: number
  radius: number
  maxRadius: number
  speed: number
  startTime: number
  heatBoost: number
  affectedCells: Set<string>
}

export interface SimulationHistory {
  timestep: number
  avgHeat: number
  regionAvg: Record<BuildingType, number>
}

export const GRID_SIZE = 10
export const CELL_SPACING = 2
export const MAX_HEAT = 100
export const MIN_HEAT = 0
export const DIFFUSION_RATE = 0.08
export const COOLING_RATE = 0.003

export const BUILDING_TYPE_CONFIG: Record<BuildingType, { name: string; color: string; baseHeat: number }> = {
  commercial: { name: '商业区', color: '#FFAA00', baseHeat: 55 },
  industrial: { name: '工业区', color: '#FF2200', baseHeat: 75 },
  residential: { name: '居住区', color: '#00FFAA', baseHeat: 35 },
  park: { name: '绿化区', color: '#0044FF', baseHeat: 15 },
}

export function assignBuildingType(gridX: number, gridZ: number): BuildingType {
  if (gridX >= 3 && gridX <= 6 && gridZ >= 3 && gridZ <= 6) {
    return 'commercial'
  }
  if ((gridX <= 2 && gridZ <= 2) || (gridX >= 7 && gridZ <= 2)) {
    return 'industrial'
  }
  if ((gridX === 0 || gridX === 9 || gridZ === 0 || gridZ === 9) && Math.random() < 0.5) {
    return 'park'
  }
  return 'residential'
}

export function heatToColor(heat: number, brightnessBoost: number = 0): string {
  const h = Math.max(MIN_HEAT, Math.min(MAX_HEAT, heat))
  const t = h / MAX_HEAT

  let r: number, g: number, b: number
  if (t < 0.33) {
    const t1 = t / 0.33
    r = lerp(0, 0, t1)
    g = lerp(0x44 / 255, 1, t1)
    b = lerp(1, 0xAA / 255, t1)
  } else if (t < 0.66) {
    const t1 = (t - 0.33) / 0.33
    r = lerp(0, 0xAA / 255, t1)
    g = lerp(1, 0xAA / 255, t1)
    b = lerp(0xAA / 255, 0, t1)
  } else {
    const t1 = (t - 0.66) / 0.34
    r = lerp(0xAA / 255, 0xFF / 255, t1)
    g = lerp(0xAA / 255, 0x22 / 255, t1)
    b = lerp(0, 0, t1)
  }

  const boost = 1 + brightnessBoost * 0.8
  r = Math.min(1, r * boost)
  g = Math.min(1, g * boost)
  b = Math.min(1, b * boost)

  const hex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function initializeBuildings(): BuildingData[] {
  const buildings: BuildingData[] = []
  const half = (GRID_SIZE - 1) * CELL_SPACING / 2

  for (let gx = 0; gx < GRID_SIZE; gx++) {
    for (let gz = 0; gz < GRID_SIZE; gz++) {
      const type = assignBuildingType(gx, gz)
      const baseHeat = BUILDING_TYPE_CONFIG[type].baseHeat + (Math.random() - 0.5) * 10
      buildings.push({
        id: `${gx}-${gz}`,
        gridX: gx,
        gridZ: gz,
        x: gx * CELL_SPACING - half,
        z: gz * CELL_SPACING - half,
        type,
        heat: baseHeat,
        baseHeat,
        brightnessBoost: 0,
      })
    }
  }
  return buildings
}

export function stepHeatDiffusion(buildings: BuildingData[]): BuildingData[] {
  const newBuildings = buildings.map(b => ({ ...b, brightnessBoost: Math.max(0, b.brightnessBoost - 0.08) }))
  const deltas: number[] = new Array(buildings.length).fill(0)

  for (let i = 0; i < buildings.length; i++) {
    const b = buildings[i]
    const neighbors = [
      `${b.gridX - 1}-${b.gridZ}`,
      `${b.gridX + 1}-${b.gridZ}`,
      `${b.gridX}-${b.gridZ - 1}`,
      `${b.gridX}-${b.gridZ + 1}`,
    ]

    let totalDiffusion = 0
    let count = 0

    for (const nId of neighbors) {
      const neighbor = buildings.find(nb => nb.id === nId)
      if (neighbor) {
        const diff = (neighbor.heat - b.heat) * DIFFUSION_RATE
        totalDiffusion += diff
        count++
      }
    }

    const cooling = (b.heat - b.baseHeat) * COOLING_RATE
    deltas[i] = totalDiffusion - cooling
  }

  for (let i = 0; i < newBuildings.length; i++) {
    newBuildings[i].heat = Math.max(
      MIN_HEAT,
      Math.min(MAX_HEAT, newBuildings[i].heat + deltas[i])
    )
  }

  return newBuildings
}

export function updatePulses(
  buildings: BuildingData[],
  pulses: PulseData[],
  currentTime: number
): { buildings: BuildingData[]; pulses: PulseData[] } {
  const updatedBuildings = buildings.map(b => ({ ...b }))
  const survivingPulses: PulseData[] = []

  for (const pulse of pulses) {
    const elapsed = (currentTime - pulse.startTime) / 1000
    const currentRadius = elapsed * pulse.speed * CELL_SPACING

    if (currentRadius < pulse.maxRadius * CELL_SPACING + 2) {
      for (let i = 0; i < updatedBuildings.length; i++) {
        const b = updatedBuildings[i]
        const cellKey = b.id
        if (pulse.affectedCells.has(cellKey)) continue

        const dx = b.x - pulse.x
        const dz = b.z - pulse.z
        const dist = Math.sqrt(dx * dx + dz * dz)

        const prevRadius = Math.max(0, (elapsed - 1 / 60) * pulse.speed * CELL_SPACING)
        if (dist <= currentRadius && dist >= prevRadius - 0.5) {
          const falloff = 1 - dist / (pulse.maxRadius * CELL_SPACING)
          if (falloff > 0) {
            const heatAdd = pulse.heatBoost * falloff
            b.heat = Math.min(MAX_HEAT, b.heat + heatAdd)
            b.brightnessBoost = Math.max(b.brightnessBoost, falloff)
            pulse.affectedCells.add(cellKey)
          }
        }
      }
      survivingPulses.push({
        ...pulse,
        radius: currentRadius,
      })
    }
  }

  return { buildings: updatedBuildings, pulses: survivingPulses }
}

export function createPulse(
  building: BuildingData,
  currentTime: number,
  maxRadius: number = 4,
  speed: number = 2,
  heatBoost: number = 25
): PulseData {
  return {
    id: `pulse-${building.id}-${currentTime}-${Math.random().toString(36).slice(2, 8)}`,
    x: building.x,
    z: building.z,
    originGridX: building.gridX,
    originGridZ: building.gridZ,
    radius: 0,
    maxRadius,
    speed,
    startTime: currentTime,
    heatBoost,
    affectedCells: new Set<string>(),
  }
}

export function getRegionAverages(buildings: BuildingData[]): Record<BuildingType, number> {
  const sums: Record<BuildingType, number> = {
    commercial: 0,
    industrial: 0,
    residential: 0,
    park: 0,
  }
  const counts: Record<BuildingType, number> = {
    commercial: 0,
    industrial: 0,
    residential: 0,
    park: 0,
  }

  for (const b of buildings) {
    sums[b.type] += b.heat
    counts[b.type]++
  }

  const result: Record<BuildingType, number> = {
    commercial: counts.commercial > 0 ? sums.commercial / counts.commercial : 0,
    industrial: counts.industrial > 0 ? sums.industrial / counts.industrial : 0,
    residential: counts.residential > 0 ? sums.residential / counts.residential : 0,
    park: counts.park > 0 ? sums.park / counts.park : 0,
  }

  return result
}

export function getTotalAverageHeat(buildings: BuildingData[]): number {
  if (buildings.length === 0) return 0
  const sum = buildings.reduce((acc, b) => acc + b.heat, 0)
  return sum / buildings.length
}

export function resetBuildings(buildings: BuildingData[]): BuildingData[] {
  return buildings.map(b => ({
    ...b,
    heat: b.baseHeat + (Math.random() - 0.5) * 10,
    brightnessBoost: 0,
  }))
}
