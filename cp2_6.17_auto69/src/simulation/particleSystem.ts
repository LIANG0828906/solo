import type { Particle, SimulationParams } from '../store/store'
import { updateParticleMotion, torusToCartesian, type PhysicsParticle, type PhysicsParams } from './physicsEngine'
import { v4 as uuidv4 } from 'uuid'

const TORUS_MAJOR_RADIUS_PX = 150
const TORUS_MINOR_RADIUS = 0.4
const PARTICLE_SIZE_MIN = 3
const PARTICLE_SIZE_MAX = 8
const TEMP_VARIATION = 0.2

export function generateParticles(count: number, baseTemp: number): Particle[] {
  const particles: Particle[] = []

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * TORUS_MINOR_RADIUS
    const height = Math.random() * Math.PI * 2

    const position = torusToCartesian({ angle, radius, height }, TORUS_MAJOR_RADIUS_PX)
    const size = PARTICLE_SIZE_MIN + Math.random() * (PARTICLE_SIZE_MAX - PARTICLE_SIZE_MIN)
    const tempVariation = baseTemp * TEMP_VARIATION
    const temperature = baseTemp + (Math.random() - 0.5) * 2 * tempVariation

    particles.push({
      id: uuidv4(),
      position,
      velocity: { x: 0, y: 0, z: 0 },
      temperature,
      size,
      angle,
      radius,
      height
    })
  }

  return particles
}

export function detectCollisions(
  particles: Particle[],
  threshold: number = 0.06
): Array<{ p1: Particle; p2: Particle; position: { x: number; y: number; z: number } }> {
  const collisions: Array<{
    p1: Particle
    p2: Particle
    position: { x: number; y: number; z: number }
  }> = []
  const thresholdSquared = threshold * threshold

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const p1 = particles[i]
      const p2 = particles[j]

      const dx = p1.position.x - p2.position.x
      const dy = p1.position.y - p2.position.y
      const dz = p1.position.z - p2.position.z
      const distanceSquared = dx * dx + dy * dy + dz * dz

      if (distanceSquared < thresholdSquared) {
        collisions.push({
          p1,
          p2,
          position: {
            x: (p1.position.x + p2.position.x) / 2,
            y: (p1.position.y + p2.position.y) / 2,
            z: (p1.position.z + p2.position.z) / 2
          }
        })
      }
    }
  }

  return collisions
}

export function updateParticles(
  particles: Particle[],
  params: SimulationParams,
  deltaTime: number
): Particle[] {
  const physicsParams: PhysicsParams = {
    magneticField: params.magneticField,
    temperature: params.temperature
  }

  return particles.map((particle) => {
    const physicsParticle: PhysicsParticle = {
      position: {
        angle: particle.angle,
        radius: particle.radius,
        height: particle.height
      },
      temperature: particle.temperature
    }
    const updated = updateParticleMotion(physicsParticle, physicsParams, deltaTime)
    const position = torusToCartesian(updated.position, TORUS_MAJOR_RADIUS_PX)
    return {
      ...particle,
      angle: updated.position.angle,
      radius: updated.position.radius,
      height: updated.position.height,
      position
    }
  })
}

export function adjustParticleCount(
  current: Particle[],
  target: number,
  baseTemp: number
): Particle[] {
  if (current.length === target) {
    return current
  }

  if (current.length < target) {
    const addCount = target - current.length
    const newParticles = generateParticles(addCount, baseTemp)
    return [...current, ...newParticles]
  }

  const removeCount = current.length - target
  return current.slice(removeCount)
}
