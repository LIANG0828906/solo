import * as THREE from 'three'

export type FieldType = 'gravity' | 'magnetic' | 'electric'

export interface FieldParams {
  fieldType: FieldType
  strength: number
  direction: { x: number; y: number; z: number }
}

export interface ParticleState {
  position: THREE.Vector3
  velocity: THREE.Vector3
  charge: number
}

const PARTICLE_MASS = 1.0
const DT = 1 / 60

export function computeFieldAcceleration(
  particle: ParticleState,
  params: FieldParams
): THREE.Vector3 {
  const acceleration = new THREE.Vector3()
  const dir = new THREE.Vector3(
    params.direction.x,
    params.direction.y,
    params.direction.z
  ).normalize()
  const strength = params.strength * 0.01

  switch (params.fieldType) {
    case 'gravity':
      acceleration.copy(dir).multiplyScalar(strength * 9.8)
      break

    case 'magnetic': {
      const B = dir.clone().multiplyScalar(strength * 50)
      acceleration.crossVectors(particle.velocity, B)
      acceleration.multiplyScalar(particle.charge / PARTICLE_MASS)
      break
    }

    case 'electric': {
      const fieldOrigin = new THREE.Vector3(0, 0, 0)
      const toParticle = particle.position.clone().sub(fieldOrigin)
      const distance = Math.max(toParticle.length(), 0.5)
      const E = toParticle.normalize().multiplyScalar(
        (strength * 100 * particle.charge) / (distance * distance)
      )
      acceleration.copy(E).multiplyScalar(particle.charge / PARTICLE_MASS)
      break
    }
  }

  return acceleration
}

export function resolveElasticCollision(
  p1: ParticleState,
  p2: ParticleState
): void {
  const normal = p1.position.clone().sub(p2.position).normalize()
  const relativeVelocity = p1.velocity.clone().sub(p2.velocity)
  const velocityAlongNormal = relativeVelocity.dot(normal)

  if (velocityAlongNormal > 0) return

  const restitution = 0.95
  const m1 = PARTICLE_MASS
  const m2 = PARTICLE_MASS
  const impulse = (-(1 + restitution) * velocityAlongNormal) / (1 / m1 + 1 / m2)

  const impulseVec = normal.clone().multiplyScalar(impulse)
  p1.velocity.add(impulseVec.clone().divideScalar(m1))
  p2.velocity.sub(impulseVec.clone().divideScalar(m2))

  const overlap = 0.6 - p1.position.distanceTo(p2.position)
  if (overlap > 0) {
    const separation = normal.clone().multiplyScalar(overlap / 2 + 0.01)
    p1.position.add(separation)
    p2.position.sub(separation)
  }
}

export function updateParticleVerlet(
  particle: ParticleState,
  acceleration: THREE.Vector3,
  bounds: number = 30
): void {
  particle.velocity.add(acceleration.clone().multiplyScalar(DT))
  particle.position.add(particle.velocity.clone().multiplyScalar(DT))

  const damping = 0.999
  particle.velocity.multiplyScalar(damping)

  const maxSpeed = 15
  if (particle.velocity.length() > maxSpeed) {
    particle.velocity.normalize().multiplyScalar(maxSpeed)
  }

  for (const axis of ['x', 'y', 'z'] as const) {
    if (particle.position[axis] > bounds) {
      particle.position[axis] = bounds
      particle.velocity[axis] *= -0.8
    } else if (particle.position[axis] < -bounds) {
      particle.position[axis] = -bounds
      particle.velocity[axis] *= -0.8
    }
  }
}

export const PARTICLE_COLORS = [
  '#ff6b35',
  '#2ecc71',
  '#9b59b6',
  '#ff2d78',
  '#00d2ff',
]

export function getRandomParticleColor(): string {
  return PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]
}
