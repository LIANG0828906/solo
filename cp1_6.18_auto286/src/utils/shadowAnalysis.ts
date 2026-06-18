import type { Building, Season } from '../store/appStore'

export interface HeatmapCell {
  x: number
  z: number
  coverage: number
}

const SEASON_MAX_ALTITUDE: Record<Season, number> = {
  spring: 45,
  summer: 70,
  autumn: 45,
  winter: 20
}

function degToRad(deg: number): number {
  return deg * Math.PI / 180
}

function calculateShadowProjection(
  building: Building,
  sunAltitude: number,
  sunAzimuth: number
): { minX: number; maxX: number; minZ: number; maxZ: number } {
  const [bx, by, bz] = building.position
  const [bw, bh, bd] = building.size

  const altitudeRad = degToRad(sunAltitude)
  const azimuthRad = degToRad(sunAzimuth)

  const shadowLength = bh / Math.tan(altitudeRad)
  const dx = shadowLength * Math.sin(azimuthRad)
  const dz = shadowLength * Math.cos(azimuthRad)

  const corners = [
    { x: bx - bw / 2, z: bz - bd / 2 },
    { x: bx + bw / 2, z: bz - bd / 2 },
    { x: bx - bw / 2, z: bz + bd / 2 },
    { x: bx + bw / 2, z: bz + bd / 2 }
  ]

  const projectedCorners = corners.map((c) => ({
    x: c.x + dx,
    z: c.z + dz
  }))

  const allX = [...corners.map((c) => c.x), ...projectedCorners.map((c) => c.x)]
  const allZ = [...corners.map((c) => c.z), ...projectedCorners.map((c) => c.z)]

  return {
    minX: Math.min(...allX),
    maxX: Math.max(...allX),
    minZ: Math.min(...allZ),
    maxZ: Math.max(...allZ)
  }
}

function pointInShadow(
  px: number,
  pz: number,
  building: Building,
  sunAltitude: number,
  sunAzimuth: number
): boolean {
  const [bx, , bz] = building.position
  const [bw, bh, bd] = building.size

  if (
    px >= bx - bw / 2 &&
    px <= bx + bw / 2 &&
    pz >= bz - bd / 2 &&
    pz <= bz + bd / 2
  ) {
    return true
  }

  const altitudeRad = degToRad(sunAltitude)
  const azimuthRad = degToRad(sunAzimuth)
  const tanAlt = Math.tan(altitudeRad)

  const dx = (px - bx) * Math.sin(azimuthRad) + (pz - bz) * Math.cos(azimuthRad)
  if (dx <= 0) return false

  const requiredHeight = dx * tanAlt

  const perpX = -(pz - bz)
  const perpZ = px - bx
  const perpDist = Math.sqrt(perpX * perpX + perpZ * perpZ)

  const localX = Math.abs((px - bx) * Math.cos(azimuthRad) - (pz - bz) * Math.sin(azimuthRad))
  const localZ = perpDist

  if (localX > bw / 2 || localZ > bd / 2) return false

  return requiredHeight <= bh
}

export function calculateShadowHeatmap(
  buildings: Building[],
  season: Season,
  gridSize: number = 1,
  sampleIntervalMinutes: number = 10
): HeatmapCell[] {
  const sceneMin = -15
  const sceneMax = 15

  const cells: HeatmapCell[] = []
  const samplesPerHour = 60 / sampleIntervalMinutes
  const totalHours = 12
  const totalSamples = totalHours * samplesPerHour

  for (let x = sceneMin; x < sceneMax; x += gridSize) {
    for (let z = sceneMin; z < sceneMax; z += gridSize) {
      let shadowedSamples = 0

      for (let s = 0; s < totalSamples; s++) {
        const time = 6 + (s / samplesPerHour)
        const progress = (time - 6) / 12
        const maxAlt = SEASON_MAX_ALTITUDE[season]
        const altitude = maxAlt * Math.sin(progress * Math.PI)
        const azimuth = -90 + progress * 180

        if (altitude <= 0) continue

        let inShadow = false
        for (const building of buildings) {
          if (pointInShadow(x + gridSize / 2, z + gridSize / 2, building, altitude, azimuth)) {
            inShadow = true
            break
          }
        }

        if (inShadow) shadowedSamples++
      }

      cells.push({
        x,
        z,
        coverage: shadowedSamples / totalSamples
      })
    }
  }

  return cells
}

export function coverageToColor(coverage: number): string {
  const clamped = Math.max(0, Math.min(1, coverage))
  const r = Math.round(clamped * 255)
  const b = Math.round((1 - clamped) * 255)
  const g = 0
  return `rgb(${r},${g},${b})`
}
