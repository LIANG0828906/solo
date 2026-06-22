import type { Particle, SimulationMode } from '../data/SimulationStore'

const EPSILON = 0.1
const DAMPING = 0.999
const BOUNDARY_RADIUS = 30
const BOUNDARY_SOFTNESS = 0.5
const TRAIL_MAX_POINTS = 10
const TRAIL_LIFETIME = 500

interface VelocityData {
  id: string
  vx: number
  vy: number
  vz: number
}

class ParticlePhysicsEngine {
  step(
    particles: Particle[],
    gravityConstant: number,
    mode: SimulationMode,
    deltaTime: number,
    prevVelocities: VelocityData[],
    targetVelocities: VelocityData[],
    modeTransitionProgress: number,
    draggedParticleId: string | null
  ): { particles: Particle[] } {
    const n = particles.length
    const newParticles: Particle[] = new Array(n)
    const now = performance.now()
    const dt = Math.min(deltaTime, 0.033)

    const accelerations: { ax: number; ay: number; az: number }[] = new Array(n)
    for (let i = 0; i < n; i++) {
      accelerations[i] = { ax: 0, ay: 0, az: 0 }
    }

    const G = gravityConstant
    const modeSign = mode === 'attract' ? 1 : -1

    for (let i = 0; i < n; i++) {
      const pi = particles[i]
      if (pi.id === draggedParticleId) continue

      for (let j = i + 1; j < n; j++) {
        const pj = particles[j]
        if (pj.id === draggedParticleId) continue

        const dx = pj.x - pi.x
        const dy = pj.y - pi.y
        const dz = pj.z - pi.z
        const distSq = dx * dx + dy * dy + dz * dz + EPSILON
        const dist = Math.sqrt(distSq)
        const forceMag = (G * modeSign) / distSq

        const invDist = 1 / dist
        const fx = forceMag * dx * invDist
        const fy = forceMag * dy * invDist
        const fz = forceMag * dz * invDist

        accelerations[i].ax += fx
        accelerations[i].ay += fy
        accelerations[i].az += fz
        accelerations[j].ax -= fx
        accelerations[j].ay -= fy
        accelerations[j].az -= fz
      }
    }

    const prevVelMap = new Map<string, VelocityData>()
    const targetVelMap = new Map<string, VelocityData>()
    prevVelocities.forEach((v) => prevVelMap.set(v.id, v))
    targetVelocities.forEach((v) => targetVelMap.set(v.id, v))

    for (let i = 0; i < n; i++) {
      const p = particles[i]
      const isDragged = p.id === draggedParticleId

      let vx = p.vx
      let vy = p.vy
      let vz = p.vz

      if (!isDragged) {
        vx += accelerations[i].ax * dt
        vy += accelerations[i].ay * dt
        vz += accelerations[i].az * dt

        vx *= DAMPING
        vy *= DAMPING
        vz *= DAMPING

        if (modeTransitionProgress < 1) {
          const pv = prevVelMap.get(p.id)
          const tv = targetVelMap.get(p.id)
          if (pv && tv) {
            const t = modeTransitionProgress
            const lerpVx = pv.vx + (tv.vx - pv.vx) * t
            const lerpVy = pv.vy + (tv.vy - pv.vy) * t
            const lerpVz = pv.vz + (tv.vz - pv.vz) * t
            vx = vx * (1 - t) + lerpVx * t * 0.5
            vy = vy * (1 - t) + lerpVy * t * 0.5
            vz = vz * (1 - t) + lerpVz * t * 0.5
          }
        }
      }

      let x = p.x
      let y = p.y
      let z = p.z

      if (!isDragged) {
        x += vx * dt
        y += vy * dt
        z += vz * dt

        const distFromCenter = Math.sqrt(x * x + y * y + z * z)
        if (distFromCenter > BOUNDARY_RADIUS) {
          const excess = distFromCenter - BOUNDARY_RADIUS
          const nx = x / distFromCenter
          const ny = y / distFromCenter
          const nz = z / distFromCenter
          x -= nx * excess * BOUNDARY_SOFTNESS
          y -= ny * excess * BOUNDARY_SOFTNESS
          z -= nz * excess * BOUNDARY_SOFTNESS
          vx -= nx * BOUNDARY_SOFTNESS * Math.abs(vx + nx * vx + ny * vy + nz * vz)
          vy -= ny * BOUNDARY_SOFTNESS * Math.abs(vy + nx * vx + ny * vy + nz * vz)
          vz -= nz * BOUNDARY_SOFTNESS * Math.abs(vz + nx * vx + ny * vy + nz * vz)
        }
      }

      const newTrail = [...(p.prevPositions || [])]
      if (!isDragged) {
        newTrail.push({ x: p.x, y: p.y, z: p.z, time: now })
      }
      while (newTrail.length > 0 && now - newTrail[0].time > TRAIL_LIFETIME) {
        newTrail.shift()
      }
      if (newTrail.length > TRAIL_MAX_POINTS) {
        newTrail.splice(0, newTrail.length - TRAIL_MAX_POINTS)
      }

      newParticles[i] = {
        ...p,
        x,
        y,
        z,
        vx,
        vy,
        vz,
        prevPositions: newTrail
      }
    }

    return { particles: newParticles }
  }
}

export const particlePhysics = new ParticlePhysicsEngine()
export default particlePhysics
