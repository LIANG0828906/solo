export interface SolarResult {
  azimuth: number
  elevation: number
  directionVector: { x: number; y: number; z: number }
  sunriseHours: number
  sunsetHours: number
  daylightDuration: number
}

const degToRad = (deg: number): number => (deg * Math.PI) / 180
const radToDeg = (rad: number): number => (rad * 180) / Math.PI

const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}

export const calculateSolarPosition = (
  dayOfYear: number,
  timeHours: number,
  latitude: number,
  longitude: number,
): SolarResult => {
  const latRad = degToRad(latitude)

  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1)

  const declination = degToRad(
    0.006918
    - 0.399912 * Math.cos(gamma)
    + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma)
    + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma)
    + 0.00148 * Math.sin(3 * gamma),
  )

  const eqTime =
    229.18
    * (0.000075
      + 0.001868 * Math.cos(gamma)
      - 0.032077 * Math.sin(gamma)
      - 0.014615 * Math.cos(2 * gamma)
      - 0.040849 * Math.sin(2 * gamma))

  const timeOffset = eqTime + 4 * longitude - 60 * 8

  const trueSolarTime = (timeHours * 60 + timeOffset) % 1440

  const hourAngle = degToRad(trueSolarTime / 4 - 180)

  const sinElevation =
    Math.sin(latRad) * Math.sin(declination)
    + Math.cos(latRad) * Math.cos(declination) * Math.cos(hourAngle)

  const elevation = Math.asin(Math.max(-1, Math.min(1, sinElevation)))

  let azimuth: number

  if (Math.cos(elevation) < 0.0001) {
    azimuth = Math.PI
  } else {
    const cosAzimuth =
      (Math.sin(declination) - Math.sin(latRad) * Math.sin(elevation))
      / (Math.cos(latRad) * Math.cos(elevation))

    const clampedCos = Math.max(-1, Math.min(1, cosAzimuth))
    azimuth = Math.acos(clampedCos)

    if (hourAngle > 0) {
      azimuth = 2 * Math.PI - azimuth
    }
  }

  const threeAzimuth = Math.PI / 2 - azimuth
  const x = Math.cos(elevation) * Math.cos(threeAzimuth)
  const y = Math.sin(elevation)
  const z = -Math.cos(elevation) * Math.sin(threeAzimuth)

  const cosHourAngleSunrise = -Math.tan(latRad) * Math.tan(declination)
  let sunriseHours: number
  let sunsetHours: number

  if (cosHourAngleSunrise > 1) {
    sunriseHours = 0
    sunsetHours = 0
  } else if (cosHourAngleSunrise < -1) {
    sunriseHours = 0
    sunsetHours = 24
  } else {
    const hourAngleSunriseDeg = radToDeg(Math.acos(cosHourAngleSunrise))
    const solarNoonHours = 12 - (4 * longitude + eqTime) / 60 + 8
    sunriseHours = solarNoonHours - hourAngleSunriseDeg / 15
    sunsetHours = solarNoonHours + hourAngleSunriseDeg / 15
    sunriseHours = Math.max(0, Math.min(24, sunriseHours))
    sunsetHours = Math.max(0, Math.min(24, sunsetHours))
  }

  const daylightDuration = sunsetHours - sunriseHours

  return {
    azimuth,
    elevation,
    directionVector: { x, y, z },
    sunriseHours,
    sunsetHours,
    daylightDuration,
  }
}

export const formatDayOfYear = (dayOfYear: number, year: number = 2024): string => {
  const date = new Date(year, 0, dayOfYear)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

export const formatTimeHours = (timeHours: number): string => {
  const hours = Math.floor(timeHours)
  const minutes = Math.round((timeHours - hours) * 60)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

export const formatDaylightDuration = (hours: number): string => {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}小时${m}分钟`
}

export const dayOfYearToDate = (dayOfYear: number, year: number = 2024): Date => {
  return new Date(year, 0, dayOfYear)
}

export { getDayOfYear, degToRad, radToDeg }
