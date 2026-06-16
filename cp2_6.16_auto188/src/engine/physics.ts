export interface Vector2D {
  x: number
  y: number
}

export interface Planet {
  id: string
  position: Vector2D
  mass: number
  radius: number
  color: string
  type: 'primary' | 'secondary'
  label?: string
}

export interface Satellite {
  id: string
  position: Vector2D
  velocity: Vector2D
  fuel: number
  trail: Vector2D[]
}

export interface Asteroid {
  position: Vector2D
  size: number
}

export const G = 500
export const DT = 1 / 60
export const MAX_TRAIL_LENGTH = 200

export function addVectors(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function subtractVectors(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x - b.x, y: a.y - b.y }
}

export function multiplyVector(v: Vector2D, scalar: number): Vector2D {
  return { x: v.x * scalar, y: v.y * scalar }
}

export function vectorMagnitude(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y)
}

export function vectorNormalize(v: Vector2D): Vector2D {
  const mag = vectorMagnitude(v)
  if (mag === 0) return { x: 0, y: 0 }
  return { x: v.x / mag, y: v.y / mag }
}

export function vectorDistance(a: Vector2D, b: Vector2D): number {
  return vectorMagnitude(subtractVectors(a, b))
}

export function calculateGravitationalForce(
  satellite: Satellite,
  planet: Planet
): Vector2D {
  const direction = subtractVectors(planet.position, satellite.position)
  const distance = vectorMagnitude(direction)
  const minDistance = planet.radius
  const safeDistance = Math.max(distance, minDistance)
  const forceMagnitude = (G * planet.mass) / (safeDistance * safeDistance)
  const normalizedDirection = vectorNormalize(direction)
  return multiplyVector(normalizedDirection, forceMagnitude)
}

export function calculateNetForce(
  satellite: Satellite,
  planets: Planet[]
): Vector2D {
  let netForce: Vector2D = { x: 0, y: 0 }
  for (const planet of planets) {
    const force = calculateGravitationalForce(satellite, planet)
    netForce = addVectors(netForce, force)
  }
  return netForce
}

export function updateSatellite(
  satellite: Satellite,
  planets: Planet[],
  dt: number = DT
): Satellite {
  const netForce = calculateNetForce(satellite, planets)
  const acceleration = netForce
  const newVelocity = addVectors(
    satellite.velocity,
    multiplyVector(acceleration, dt)
  )
  const newPosition = addVectors(
    satellite.position,
    multiplyVector(newVelocity, dt)
  )

  const newTrail = [...satellite.trail, { ...newPosition }]
  if (newTrail.length > MAX_TRAIL_LENGTH) {
    newTrail.shift()
  }

  return {
    ...satellite,
    position: newPosition,
    velocity: newVelocity,
    trail: newTrail,
  }
}

export function checkCollision(
  satellite: Satellite,
  planets: Planet[]
): Planet | null {
  for (const planet of planets) {
    const distance = vectorDistance(satellite.position, planet.position)
    if (distance < planet.radius + 5) {
      return planet
    }
  }
  return null
}

export function getOrbitalParameters(
  satellite: Satellite,
  primaryPlanet: Planet
): {
  semiMajorAxis: number
  eccentricity: number
  periapsis: number
  apoapsis: number
  orbitalSpeed: number
  distance: number
} {
  const positionVector = subtractVectors(satellite.position, primaryPlanet.position)
  const distance = vectorMagnitude(positionVector)
  const speed = vectorMagnitude(satellite.velocity)
  const specificEnergy = (speed * speed) / 2 - (G * primaryPlanet.mass) / distance

  const semiMajorAxis = -(G * primaryPlanet.mass) / (2 * specificEnergy)

  const positionUnit = vectorNormalize(positionVector)
  const velocityDotPosition =
    satellite.velocity.x * positionUnit.x + satellite.velocity.y * positionUnit.y
  const radialVelocity = velocityDotPosition

  const angularMomentum = distance * vectorMagnitude(satellite.velocity)
  const eccentricity = Math.sqrt(
    1 +
      (2 * specificEnergy * angularMomentum * angularMomentum) /
        (G * G * primaryPlanet.mass * primaryPlanet.mass)
  )

  const periapsis = semiMajorAxis * (1 - eccentricity)
  const apoapsis = semiMajorAxis * (1 + eccentricity)

  return {
    semiMajorAxis,
    eccentricity: isNaN(eccentricity) ? 0 : Math.min(eccentricity, 2),
    periapsis,
    apoapsis,
    orbitalSpeed: speed,
    distance,
  }
}

export function isInOrbit(
  satellite: Satellite,
  primaryPlanet: Planet,
  targetOrbitType: 'circular' | 'elliptical' | 'polar',
  tolerance: number = 0.15
): boolean {
  const params = getOrbitalParameters(satellite, primaryPlanet)

  if (params.eccentricity >= 1 || params.eccentricity < 0) return false
  if (params.distance < primaryPlanet.radius + 20) return false
  if (params.periapsis < primaryPlanet.radius + 10) return false

  switch (targetOrbitType) {
    case 'circular':
      return params.eccentricity < tolerance
    case 'elliptical':
      return params.eccentricity >= tolerance && params.eccentricity < 0.6
    case 'polar':
      return params.eccentricity < tolerance * 1.5
    default:
      return false
  }
}

export function generateAsteroids(
  center: Vector2D,
  innerRadius: number,
  outerRadius: number,
  count: number
): Asteroid[] {
  const asteroids: Asteroid[] = []
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = innerRadius + Math.random() * (outerRadius - innerRadius)
    asteroids.push({
      position: {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      },
      size: 1 + Math.random() * 2,
    })
  }
  return asteroids
}
