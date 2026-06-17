export interface ParticleData {
  id: number
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  life: number
  maxLife: number
  size: number
  trail: { x: number; y: number; z: number }[]
}

export interface PhysicsParams {
  gravity: number
  windX: number
  windY: number
  windZ: number
  drag: number
  restitution: number
  trailLength: number
}

export class PhysicsEngine {
  params: PhysicsParams

  constructor(params: Partial<PhysicsParams> = {}) {
    this.params = {
      gravity: 9.8,
      windX: 1,
      windY: 0,
      windZ: 0,
      drag: 0.02,
      restitution: 0.5,
      trailLength: 20,
      ...params,
    }
  }

  setParams(params: Partial<PhysicsParams>) {
    this.params = { ...this.params, ...params }
  }

  step(particles: ParticleData[], dt: number): ParticleData[] {
    const { gravity, windX, windY, windZ, drag, restitution, trailLength } = this.params
    const result: ParticleData[] = []

    for (const p of particles) {
      const life = p.life - dt
      if (life <= 0) continue

      let vx = p.vx + (windX - p.vx * drag) * dt
      let vy = p.vy + (windY - p.vy * drag - gravity) * dt
      let vz = p.vz + (windZ - p.vz * drag) * dt

      let x = p.x + vx * dt
      let y = p.y + vy * dt
      let z = p.z + vz * dt

      if (y <= 0) {
        y = 0
        vy = -vy * restitution
        vx *= 0.98
        vz *= 0.98
        if (Math.abs(vy) < 0.1) {
          vy = 0
        }
      }

      const newTrail = [...p.trail, { x: p.x, y: p.y, z: p.z }]
      if (newTrail.length > trailLength) {
        newTrail.splice(0, newTrail.length - trailLength)
      }

      result.push({
        ...p,
        x,
        y,
        z,
        vx,
        vy,
        vz,
        life,
        trail: newTrail,
      })
    }

    return result
  }
}
