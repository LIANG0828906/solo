import * as THREE from 'three'
import { v4 as uuidv4 } from 'uuid'

export interface ParticleFrame {
  lat: number
  lon: number
  position: THREE.Vector3
}

export interface OceanParticle {
  id: string
  path: ParticleFrame[]
  temperature: number[]
  speed: number[]
  initialVelocity: THREE.Vector3
}

export interface RenderParticle {
  id: string
  position: THREE.Vector3
  color: THREE.Color
  size: number
  temperature: number
  speed: number
  lat: number
  latDir: 'N' | 'S'
  lon: number
  lonDir: 'E' | 'W'
}

const EARTH_RADIUS = 10
const PARTICLE_COUNT = 100
const FRAME_COUNT = 24
const MIN_TEMP = -2
const MAX_TEMP = 30
const MIN_SIZE = 2
const MAX_SIZE = 8
const MIN_SPEED = 2
const MAX_SPEED = 8

const COLD_COLOR = new THREE.Color('#1A237E')
const MID_COLOR = new THREE.Color('#FFFFFF')
const HOT_COLOR = new THREE.Color('#FF5722')

function latLonToVector(lat: number, lon: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -EARTH_RADIUS * Math.sin(phi) * Math.cos(theta),
    EARTH_RADIUS * Math.cos(phi),
    EARTH_RADIUS * Math.sin(phi) * Math.sin(theta)
  )
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpColor(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
  return new THREE.Color().lerpColors(a, b, t)
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function generateFibonacciSphere(count: number): Array<{ lat: number; lon: number }> {
  const points: Array<{ lat: number; lon: number }> = []
  const phi = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const radiusAtY = Math.sqrt(1 - y * y)
    const theta = phi * i
    const x = Math.cos(theta) * radiusAtY
    const z = Math.sin(theta) * radiusAtY
    const lat = Math.asin(y) * (180 / Math.PI)
    const lon = Math.atan2(z, x) * (180 / Math.PI)
    points.push({ lat, lon })
  }
  return points
}

function generateParticleData(): OceanParticle[] {
  const initialPoints = generateFibonacciSphere(PARTICLE_COUNT)
  const particles: OceanParticle[] = []

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const id = uuidv4()
    const { lat: startLat, lon: startLon } = initialPoints[i]
    const path: ParticleFrame[] = []
    const temperature: number[] = []
    const speed: number[] = []

    const driftSpeed = (Math.random() - 0.5) * 60
    const seasonAmplitude = 5 + Math.random() * 10
    const latPhase = Math.random() * Math.PI * 2
    const lonPhase = Math.random() * Math.PI * 2
    const baseSpeed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED)
    const tempBaseOffset = (Math.random() - 0.5) * 6

    for (let frame = 0; frame < FRAME_COUNT; frame++) {
      const t = frame / (FRAME_COUNT - 1)
      const seasonal = Math.sin(t * Math.PI * 2 + latPhase)
      let currentLat = startLat + seasonal * seasonAmplitude
      let currentLon = startLon + driftSpeed * t + Math.sin(t * Math.PI * 3 + lonPhase) * 8

      currentLat = Math.max(-85, Math.min(85, currentLat))
      while (currentLon > 180) currentLon -= 360
      while (currentLon < -180) currentLon += 360

      const seasonalTemp = Math.sin(t * Math.PI * 2) * 4
      const temp = Math.max(
        MIN_TEMP,
        Math.min(
          MAX_TEMP,
          30 - Math.abs(currentLat) * 0.6 + seasonalTemp + tempBaseOffset
        )
      )
      const spd = baseSpeed * (0.8 + Math.sin(t * Math.PI * 4 + i) * 0.2)

      path.push({
        lat: currentLat,
        lon: currentLon,
        position: latLonToVector(currentLat, currentLon),
      })
      temperature.push(temp)
      speed.push(Math.max(MIN_SPEED, Math.min(MAX_SPEED, spd)))
    }

    const velDir = new THREE.Vector3(
      Math.cos((startLat + 10) * (Math.PI / 180)),
      (Math.random() - 0.5) * 0.5,
      Math.sin((startLat + 10) * (Math.PI / 180))
    ).normalize()

    particles.push({
      id,
      path,
      temperature,
      speed,
      initialVelocity: velDir,
    })
  }

  return particles
}

const OCEAN_PARTICLES = generateParticleData()

export function getTotalParticles(): number {
  return PARTICLE_COUNT
}

export function tempToColor(temp: number): THREE.Color {
  const normalized = Math.max(0, Math.min(1, (temp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)))
  if (normalized < 0.5) {
    return lerpColor(COLD_COLOR, MID_COLOR, normalized * 2)
  } else {
    return lerpColor(MID_COLOR, HOT_COLOR, (normalized - 0.5) * 2)
  }
}

export function speedToSize(speed: number): number {
  const normalized = (speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)
  return MIN_SIZE + normalized * (MAX_SIZE - MIN_SIZE)
}

export function getParticlesAtTime(time: number): RenderParticle[] {
  const clampedTime = Math.max(0, Math.min(FRAME_COUNT - 1.0001, time))
  const frameIndex = Math.floor(clampedTime)
  const t = clampedTime - frameIndex
  const nextIndex = Math.min(frameIndex + 1, FRAME_COUNT - 1)
  const smoothT = easeInOutQuad(t)

  const result: RenderParticle[] = []

  for (let i = 0; i < OCEAN_PARTICLES.length; i++) {
    const p = OCEAN_PARTICLES[i]
    const f0 = p.path[frameIndex]
    const f1 = p.path[nextIndex]

    const lat = lerp(f0.lat, f1.lat, smoothT)
    let lon = lerp(f0.lon, f1.lon, smoothT)
    if (Math.abs(f1.lon - f0.lon) > 180) {
      if (f1.lon > f0.lon) {
        lon = lerp(f0.lon, f1.lon - 360, smoothT)
      } else {
        lon = lerp(f0.lon, f1.lon + 360, smoothT)
      }
    }
    while (lon > 180) lon -= 360
    while (lon < -180) lon += 360

    const position = latLonToVector(lat, lon)
    const temperature = lerp(p.temperature[frameIndex], p.temperature[nextIndex], smoothT)
    const speed = lerp(p.speed[frameIndex], p.speed[nextIndex], smoothT)
    const color = tempToColor(temperature)
    const size = speedToSize(speed)

    result.push({
      id: p.id,
      position,
      color,
      size,
      temperature,
      speed,
      lat,
      latDir: lat >= 0 ? 'N' : 'S',
      lon,
      lonDir: lon >= 0 ? 'E' : 'W',
    })
  }

  return result
}

export function getParticleById(id: string, time: number): RenderParticle | null {
  const particles = getParticlesAtTime(time)
  return particles.find(p => p.id === id) || null
}

export { FRAME_COUNT as TOTAL_FRAMES }
