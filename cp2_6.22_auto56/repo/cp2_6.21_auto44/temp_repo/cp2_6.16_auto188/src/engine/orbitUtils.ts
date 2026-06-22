import { Vector2D, Planet, Satellite, G, vectorMagnitude, vectorNormalize, subtractVectors, addVectors, multiplyVector, vectorDistance } from './physics'

export function calculateHohmannTransfer(
  startPlanet: Planet,
  endPlanet: Planet,
  startAltitude: number,
  endAltitude: number
): {
  transferSemiMajorAxis: number
  deltaV1: number
  deltaV2: number
  totalDeltaV: number
  transferTime: number
  departureAngle: number
} {
  const r1 = vectorDistance(startPlanet.position, endPlanet.position)
  const r2 = r1 * 0.6
  const a = (r1 + r2) / 2

  const v1 = Math.sqrt(G * startPlanet.mass / r1)
  const v2 = Math.sqrt(G * startPlanet.mass / r2)
  const vPeriapsis = Math.sqrt(G * startPlanet.mass * (2 / r1 - 1 / a))
  const vApoapsis = Math.sqrt(G * startPlanet.mass * (2 / r2 - 1 / a))

  const deltaV1 = vPeriapsis - v1
  const deltaV2 = v2 - vApoapsis

  const transferTime = Math.PI * Math.sqrt(a * a * a / (G * startPlanet.mass))

  const angularRate = Math.sqrt(G * endPlanet.mass) / Math.pow(r2, 1.5)
  const departureAngle = Math.PI - angularRate * transferTime

  return {
    transferSemiMajorAxis: a,
    deltaV1: Math.abs(deltaV1),
    deltaV2: Math.abs(deltaV2),
    totalDeltaV: Math.abs(deltaV1) + Math.abs(deltaV2),
    transferTime,
    departureAngle,
  }
}

export function calculateOrbitalPeriod(
  semiMajorAxis: number,
  centralMass: number
): number {
  return 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / (G * centralMass))
}

export function calculateEscapeVelocity(
  planet: Planet,
  distance: number
): number {
  return Math.sqrt((2 * G * planet.mass) / distance)
}

export function calculateFuelConsumption(deltaV: number): number {
  const fuelPerDeltaV = 0.08
  return deltaV * fuelPerDeltaV
}

export function applyThrust(
  satellite: Satellite,
  direction: Vector2D,
  deltaV: number
): Satellite {
  const normalizedDir = vectorNormalize(direction)
  const velocityChange = multiplyVector(normalizedDir, deltaV)
  const newVelocity = addVectors(satellite.velocity, velocityChange)
  const fuelCost = calculateFuelConsumption(deltaV)

  return {
    ...satellite,
    velocity: newVelocity,
    fuel: Math.max(0, satellite.fuel - fuelCost),
  }
}

export function getOrbitType(eccentricity: number): string {
  if (eccentricity < 0.1) return '近圆轨道'
  if (eccentricity < 0.3) return '微椭圆轨道'
  if (eccentricity < 0.6) return '椭圆轨道'
  if (eccentricity < 0.9) return '高椭圆轨道'
  if (eccentricity < 1.0) return '极扁椭圆轨道'
  if (eccentricity === 1.0) return '抛物线轨迹'
  return '双曲线轨迹'
}

export function getOrbitPoints(
  focus: Vector2D,
  semiMajorAxis: number,
  eccentricity: number,
  rotation: number = 0,
  numPoints: number = 100
): Vector2D[] {
  const points: Vector2D[] = []
  const semiMinorAxis = semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity)
  const centerOffset = semiMajorAxis * eccentricity

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2
    const x = semiMajorAxis * Math.cos(angle) - centerOffset
    const y = semiMinorAxis * Math.sin(angle)

    const rotatedX = x * Math.cos(rotation) - y * Math.sin(rotation)
    const rotatedY = x * Math.sin(rotation) + y * Math.cos(rotation)

    points.push({
      x: focus.x + rotatedX,
      y: focus.y + rotatedY,
    })
  }

  return points
}

export function getTargetOrbitRadius(orbitType: 'circular' | 'elliptical' | 'polar'): number {
  switch (orbitType) {
    case 'circular':
      return 150
    case 'elliptical':
      return 200
    case 'polar':
      return 120
    default:
      return 150
  }
}

export function isSphereOfInfluence(
  satellite: Satellite,
  planet: Planet,
  soeFactor: number = 0.3
): boolean {
  const distance = vectorDistance(satellite.position, planet.position)
  const soiRadius = planet.mass * soeFactor
  return distance < soiRadius
}

export function calculateTransferScore(
  fuelUsed: number,
  timeTaken: number,
  arrived: boolean
): number {
  if (!arrived) return 0
  const fuelScore = (1 - fuelUsed) * 500
  const timeBonus = Math.max(0, 1000 - timeTaken * 0.5)
  const arrivalBonus = 500
  return Math.round(fuelScore + timeBonus + arrivalBonus)
}
