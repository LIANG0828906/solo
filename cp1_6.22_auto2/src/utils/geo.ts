const DEG_TO_RAD = Math.PI / 180
const EARTH_RADIUS = 6371000

export function latLonToWorld(lat: number, lon: number): { x: number; z: number } {
  return {
    x: lon * DEG_TO_RAD * EARTH_RADIUS / 1000,
    z: -lat * DEG_TO_RAD * EARTH_RADIUS / 1000,
  }
}

export function worldToLatLon(x: number, z: number): { lat: number; lon: number } {
  return {
    lat: -z * 1000 / EARTH_RADIUS / DEG_TO_RAD,
    lon: x * 1000 / EARTH_RADIUS / DEG_TO_RAD,
  }
}

export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD
  const dLon = (lon2 - lon1) * DEG_TO_RAD
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) *
    Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS * c
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
