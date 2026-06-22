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

export function sunDirectionFromAngles(azimuth: number, altitude: number): { x: number; y: number; z: number } {
  const azimuthRad = (azimuth * Math.PI) / 180
  const altitudeRad = (altitude * Math.PI) / 180
  const dir = {
    x: Math.cos(altitudeRad) * Math.sin(azimuthRad),
    y: Math.sin(altitudeRad),
    z: Math.cos(altitudeRad) * Math.cos(azimuthRad),
  }
  const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z)
  if (len > 0) {
    dir.x /= len
    dir.y /= len
    dir.z /= len
  }
  return dir
}

export function calculateFaceIntensity(
  faceNormal: { x: number; y: number; z: number },
  sunDirection: { x: number; y: number; z: number }
): number {
  const nx = faceNormal.x
  const ny = faceNormal.y
  const nz = faceNormal.z
  const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz)
  if (nLen === 0) return 0

  const sx = sunDirection.x
  const sy = sunDirection.y
  const sz = sunDirection.z
  const sLen = Math.sqrt(sx * sx + sy * sy + sz * sz)
  if (sLen === 0) return 0

  const dot = (nx * sx + ny * sy + nz * sz) / (nLen * sLen)
  return Math.max(0, dot)
}

export function findSunriseHour(
  month: number,
  day: number,
  latitude: number,
  longitude: number
): number {
  let lo = 0
  let hi = 12
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2
    const { altitude } = calculateSunPosition(month, day, mid, latitude, longitude)
    if (altitude > 0) {
      hi = mid
    } else {
      lo = mid
    }
  }
  return (lo + hi) / 2
}

export function findSunsetHour(
  month: number,
  day: number,
  latitude: number,
  longitude: number
): number {
  let lo = 12
  let hi = 24
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2
    const { altitude } = calculateSunPosition(month, day, mid, latitude, longitude)
    if (altitude > 0) {
      lo = mid
    } else {
      hi = mid
    }
  }
  return (lo + hi) / 2
}

export function calculateCumulativeIntensities(
  month: number,
  day: number,
  currentHour: number,
  latitude: number,
  longitude: number,
  faces: BuildingFace[],
  stepHours: number = 0.1
): number[] {
  const sunrise = findSunriseHour(month, day, latitude, longitude)
  const sunset = findSunsetHour(month, day, latitude, longitude)
  const effectiveEnd = Math.min(currentHour, sunset)

  if (effectiveEnd <= sunrise || faces.length === 0) {
    return new Array(faces.length).fill(0)
  }

  const cumulative = new Array(faces.length).fill(0)
  let actualSteps = 0

  for (let h = sunrise; h <= effectiveEnd; h += stepHours) {
    const { azimuth, altitude } = calculateSunPosition(month, day, h, latitude, longitude)
    if (altitude <= 0.1) continue

    const sunDir = sunDirectionFromAngles(azimuth, altitude)
    actualSteps++

    for (let i = 0; i < faces.length; i++) {
      const intensity = calculateFaceIntensity(faces[i].normal, sunDir)
      cumulative[i] += Math.max(0, intensity)
    }
  }

  if (actualSteps === 0) return new Array(faces.length).fill(0)

  const maxCumulative = Math.max(...cumulative, 0.0001)
  const normalized = cumulative.map((c) => Math.min(1, c / maxCumulative))

  return normalized
}

export function calculateInstantaneousIntensities(
  month: number,
  day: number,
  currentHour: number,
  latitude: number,
  longitude: number,
  faces: BuildingFace[]
): number[] {
  const { azimuth, altitude } = calculateSunPosition(month, day, currentHour, latitude, longitude)
  if (altitude <= 0 || faces.length === 0) {
    return new Array(faces.length).fill(0)
  }

  const sunDir = sunDirectionFromAngles(azimuth, altitude)
  return faces.map((face) => calculateFaceIntensity(face.normal, sunDir))
}

export function updateAllFaceIntensities(): void {
  const state = useSunStore.getState()
  const { currentDate, timeHour, latitude, longitude, buildingFaces } = state

  if (buildingFaces.length === 0) return

  const intensities = calculateCumulativeIntensities(
    currentDate.month,
    currentDate.day,
    timeHour,
    latitude,
    longitude,
    buildingFaces
  )

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
  const bayWindow = { x: -1, y: 3, z: -3.3, w: 2.5, h: 3.5, d: 0.6 }
  const entrance = { x: 1, y: 1.5, z: -3.1, w: 2, h: 3, d: 0.4 }

  const buildings = [mainBuilding, wingBuilding, towerBuilding, bayWindow, entrance]

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

    faces.push({
      id: `b${bIdx}_top`,
      normal: { x: 0, y: 1, z: 0 },
      intensity: 0,
      position: { x: b.x, y: b.y + b.h / 2, z: b.z },
      size: { width: b.w, height: b.d },
    })
  })

  return faces
}
