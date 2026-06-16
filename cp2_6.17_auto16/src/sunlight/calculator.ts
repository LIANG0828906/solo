import { useSunStore, BuildingFace } from '../storage/store'

function julianDay(month: number, day: number, year: number = 2024): number {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
}

function equationOfTime(dayOfYear: number): number {
  const B = (2 * Math.PI * (dayOfYear - 81)) / 365
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)
}

function solarDeclination(dayOfYear: number): number {
  return 23.45 * Math.sin((2 * Math.PI * (284 + dayOfYear)) / 365)
}

function dayOfYear(month: number, day: number): number {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let doy = 0
  for (let i = 0; i < month - 1; i++) {
    doy += daysInMonth[i]
  }
  doy += day
  return doy
}

export function calculateSunPosition(
  month: number,
  day: number,
  hour: number,
  latitude: number,
  longitude: number
): { azimuth: number; altitude: number } {
  const doy = dayOfYear(month, day)
  const declination = solarDeclination(doy)
  const eot = equationOfTime(doy)

  const lstm = 15 * Math.round(longitude / 15)
  const tc = 4 * (longitude - lstm) + eot
  const lst = hour + tc / 60

  const ha = 15 * (lst - 12)

  const latRad = (latitude * Math.PI) / 180
  const decRad = (declination * Math.PI) / 180
  const haRad = (ha * Math.PI) / 180

  const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad)
  const altitude = (Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180) / Math.PI

  if (altitude <= 0) {
    return { azimuth: 180, altitude: 0 }
  }

  const cosAz =
    (Math.sin(decRad) * Math.cos(latRad) - Math.cos(decRad) * Math.sin(latRad) * Math.cos(haRad)) /
    Math.cos((altitude * Math.PI) / 180)
  const sinAz = (-Math.cos(decRad) * Math.sin(haRad)) / Math.cos((altitude * Math.PI) / 180)

  let azimuth = (Math.atan2(sinAz, cosAz) * 180) / Math.PI
  if (azimuth < 0) azimuth += 360

  return { azimuth, altitude }
}

export function calculateFaceIntensity(
  faceNormal: { x: number; y: number; z: number },
  sunDirection: { x: number; y: number; z: number }
): number {
  const dot = faceNormal.x * sunDirection.x + faceNormal.y * sunDirection.y + faceNormal.z * sunDirection.z
  return Math.max(0, dot)
}

export function updateAllFaceIntensities(): void {
  const state = useSunStore.getState()
  const { buildingFaces, sunDirection } = state

  if (buildingFaces.length === 0) return

  const intensities = buildingFaces.map((face) => calculateFaceIntensity(face.normal, sunDirection))
  useSunStore.getState().updateFaceIntensities(intensities)
}

export function recalculateSunPosition(): void {
  const state = useSunStore.getState()
  const { currentDate, timeHour, latitude, longitude } = state

  const { azimuth, altitude } = calculateSunPosition(
    currentDate.month,
    currentDate.day,
    timeHour,
    latitude,
    longitude
  )

  useSunStore.getState().setSunPosition(azimuth, altitude)
}

export function generateBuildingFaces(): BuildingFace[] {
  const faces: BuildingFace[] = []

  const mainBuilding = { x: 0, y: 3, z: 0, w: 8, h: 6, d: 6 }
  const wingBuilding = { x: 5, y: 2, z: -1, w: 3, h: 4, d: 4 }
  const towerBuilding = { x: -3, y: 4, z: 2, w: 2, h: 8, d: 2 }

  const buildings = [mainBuilding, wingBuilding, towerBuilding]

  buildings.forEach((b, bIdx) => {
    faces.push({
      id: `b${bIdx}_south`,
      normal: { x: 0, y: 0, z: -1 },
      intensity: 0,
      position: { x: b.x, y: b.y, z: b.z - b.d / 2 },
      size: { width: b.w, height: b.h },
    })

    faces.push({
      id: `b${bIdx}_north`,
      normal: { x: 0, y: 0, z: 1 },
      intensity: 0,
      position: { x: b.x, y: b.y, z: b.z + b.d / 2 },
      size: { width: b.w, height: b.h },
    })

    faces.push({
      id: `b${bIdx}_east`,
      normal: { x: 1, y: 0, z: 0 },
      intensity: 0,
      position: { x: b.x + b.w / 2, y: b.y, z: b.z },
      size: { width: b.d, height: b.h },
    })

    faces.push({
      id: `b${bIdx}_west`,
      normal: { x: -1, y: 0, z: 0 },
      intensity: 0,
      position: { x: b.x - b.w / 2, y: b.y, z: b.z },
      size: { width: b.d, height: b.h },
    })
  })

  return faces
}
