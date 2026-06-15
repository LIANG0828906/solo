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

  const declination = degToRad(23.45 * Math.sin(degToRad((360 / 365) * (dayOfYear - 81))))

  const standardMeridian = 15 * Math.round(longitude / 15)
  const solarNoon = 12 + (standardMeridian - longitude) / 15

  const hourAngle = degToRad(15 * (timeHours - solarNoon))

  const sinElevation =
    Math.sin(latRad) * Math.sin(declination) +
    Math.cos(latRad) * Math.cos(declination) * Math.cos(hourAngle)

  const elevation = Math.asin(Math.max(-1, Math.min(1, sinElevation)))

  let azimuth: number

  if (Math.cos(elevation) < 0.001) {
    azimuth = Math.PI
  } else {
    const sinAzimuth = -Math.cos(declination) * Math.sin(hourAngle) / Math.cos(elevation)
    const cosAzimuth =
      (Math.sin(declination) - Math.sin(latRad) * Math.sin(elevation)) /
      (Math.cos(latRad) * Math.cos(elevation))

    azimuth = Math.atan2(sinAzimuth, cosAzimuth)

    if (azimuth < 0) {
      azimuth += 2 * Math.PI
    }
  }

  const x = Math.cos(elevation) * Math.sin(azimuth)
  const y = Math.sin(elevation)
  const z = Math.cos(elevation) * Math.cos(azimuth)

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
    const hourAngleSunrise = Math.acos(cosHourAngleSunrise)
    sunriseHours = solarNoon - radToDeg(hourAngleSunrise) / 15
    sunsetHours = solarNoon + radToDeg(hourAngleSunrise) / 15
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
