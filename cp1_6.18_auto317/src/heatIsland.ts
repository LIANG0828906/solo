import { createNoise2D } from 'simplex-noise'
import type { CityBuilding, HeatGridCell, SimulationParams, HeatStatistics } from './types'
import { GRID_SIZE, SCENE_SIZE, BASE_TEMP } from './types'

const noise2D = createNoise2D()

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1))
}

export function generateBuildings(): CityBuilding[] {
  const buildingCount = randomInt(30, 50)
  const buildings: CityBuilding[] = []
  const halfScene = SCENE_SIZE / 2

  for (let i = 0; i < buildingCount; i++) {
    const width = randomRange(0.3, 1.0)
    const depth = randomRange(0.3, 1.0)
    const height = randomRange(2, 6)

    const x = randomRange(-halfScene + width / 2 + 0.3, halfScene - width / 2 - 0.3)
    const z = randomRange(-halfScene + depth / 2 + 0.3, halfScene - depth / 2 - 0.3)

    const orientations: Array<'north' | 'south' | 'east' | 'west'> = ['north', 'south', 'east', 'west']
    const orientation = orientations[randomInt(0, 3)]

    const heatLevel = height > 4.5 ? 'high' : height > 3 ? 'medium' : 'low'

    buildings.push({
      id: `building-${i}-${Date.now()}`,
      position: { x, z },
      width,
      depth,
      height,
      orientation,
      heatLevel,
    })
  }

  return buildings
}

function calculateBuildingDensityAt(gridX: number, gridZ: number, buildings: CityBuilding[], cellSize: number): number {
  const halfScene = SCENE_SIZE / 2
  const worldX = (gridX / GRID_SIZE) * SCENE_SIZE - halfScene + cellSize / 2
  const worldZ = (gridZ / GRID_SIZE) * SCENE_SIZE - halfScene + cellSize / 2

  const searchRadius = 1.5
  let totalFootprint = 0

  for (const b of buildings) {
    const dx = worldX - b.position.x
    const dz = worldZ - b.position.z
    const dist = Math.sqrt(dx * dx + dz * dz)

    if (dist < searchRadius + Math.max(b.width, b.depth) / 2) {
      totalFootprint += b.width * b.depth
    }
  }

  const searchArea = Math.PI * searchRadius * searchRadius
  return Math.min(1, totalFootprint / searchArea)
}

function calculateBuildingHeightAt(gridX: number, gridZ: number, buildings: CityBuilding[]): number {
  const halfScene = SCENE_SIZE / 2
  const cellSize = SCENE_SIZE / GRID_SIZE
  const worldX = (gridX / GRID_SIZE) * SCENE_SIZE - halfScene + cellSize / 2
  const worldZ = (gridZ / GRID_SIZE) * SCENE_SIZE - halfScene + cellSize / 2

  let maxHeight = 0
  const searchRadius = 1.2

  for (const b of buildings) {
    const dx = worldX - b.position.x
    const dz = worldZ - b.position.z
    const dist = Math.sqrt(dx * dx + dz * dz)

    if (dist < searchRadius + Math.max(b.width, b.depth) / 2) {
      const influence = Math.max(0, 1 - dist / (searchRadius + b.height * 0.3))
      maxHeight = Math.max(maxHeight, b.height * influence)
    }
  }

  return maxHeight
}

function getGreenFactor(gridX: number, gridZ: number, coverage: number): number {
  if (coverage <= 0) return 0
  const scale = 0.8
  const noiseVal = noise2D(gridX * 0.3 * scale, gridZ * 0.3 * scale)
  const normalized = (noiseVal + 1) / 2
  const threshold = 1 - coverage / 100
  return normalized > threshold ? (normalized - threshold) / (1 - threshold) : 0
}

function getWaterFactor(gridX: number, gridZ: number, coverage: number): number {
  if (coverage <= 0) return 0
  const scale = 0.6
  const noiseVal = noise2D(gridX * 0.2 * scale + 100, gridZ * 0.2 * scale + 100)
  const normalized = (noiseVal + 1) / 2
  const threshold = 1 - coverage / 100
  return normalized > threshold ? (normalized - threshold) / (1 - threshold) : 0
}

export function updateHeatGrid(
  buildings: CityBuilding[],
  params: SimulationParams
): { grid: HeatGridCell[]; statistics: HeatStatistics } {
  const grid: HeatGridCell[] = []
  const cellSize = SCENE_SIZE / GRID_SIZE
  const temperatures: number[] = []

  for (let z = 0; z < GRID_SIZE; z++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const density = calculateBuildingDensityAt(x, z, buildings, cellSize)
      const avgHeight = calculateBuildingHeightAt(x, z, buildings)

      const densityHeat = (density * 10) * 1.5
      const heightHeat = avgHeight * 0.8

      const greenFactor = getGreenFactor(x, z, params.greenCoverage)
      const waterFactor = getWaterFactor(x, z, params.waterCoverage)

      const greenCooling = greenFactor * 1.2 * 4
      const waterCooling = waterFactor * 2 * 2

      const sunlightMultiplier = params.sunlightIntensity / 100

      let temperature = BASE_TEMP
      temperature += (densityHeat + heightHeat) * sunlightMultiplier
      temperature -= greenCooling + waterCooling

      temperature = Math.max(BASE_TEMP - 5, Math.min(BASE_TEMP + 20, temperature))

      const halfScene = SCENE_SIZE / 2
      grid.push({
        x: (x / GRID_SIZE) * SCENE_SIZE - halfScene + cellSize / 2,
        z: (z / GRID_SIZE) * SCENE_SIZE - halfScene + cellSize / 2,
        temperature,
      })

      temperatures.push(temperature)
    }
  }

  const avgTemp = temperatures.reduce((a, b) => a + b, 0) / temperatures.length
  const maxTemp = Math.max(...temperatures)
  const minTemp = Math.min(...temperatures)
  const variance = temperatures.reduce((sum, t) => sum + Math.pow(t - avgTemp, 2), 0) / temperatures.length
  const stdDev = Math.sqrt(variance)

  return {
    grid,
    statistics: {
      avgTemp: Math.round(avgTemp * 10) / 10,
      maxTemp: Math.round(maxTemp * 10) / 10,
      minTemp: Math.round(minTemp * 10) / 10,
      stdDev: Math.round(stdDev * 100) / 100,
    },
  }
}

export function getHeatColor(temperature: number, minTemp: number, maxTemp: number): [number, number, number] {
  const range = maxTemp - minTemp || 1
  const t = (temperature - minTemp) / range

  const coldR = 0
  const coldG = 0
  const coldB = 1

  const hotR = 1
  const hotG = 0
  const hotB = 0

  const r = coldR + (hotR - coldR) * t
  const g = coldG + (hotG - coldG) * t
  const b = coldB + (hotB - coldB) * t

  return [r, g, b]
}
