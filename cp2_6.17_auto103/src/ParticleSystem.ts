import { PhysicsEngine, ParticleData, PhysicsParams } from './PhysicsEngine'

export interface EmitConfig {
  count: number
  sizeMin: number
  sizeMax: number
  lifetime: number
  originX?: number
  originY?: number
  originZ?: number
}

export interface ParticleSystemState {
  particles: ParticleData[]
}

export interface UpdateParticlesOptions {
  params?: Partial<PhysicsParams>
  colorStart?: string
  colorEnd?: string
  sizeMin?: number
  sizeMax?: number
  lifetime?: number
}

let nextId = 0

export function createParticle(config: EmitConfig): ParticleData {
  const theta = Math.random() * Math.PI * 2
  const phi = Math.random() * Math.PI
  const speed = 3 + Math.random() * 5

  const vx = Math.sin(phi) * Math.cos(theta) * speed
  const vy = Math.cos(phi) * speed + 2
  const vz = Math.sin(phi) * Math.sin(theta) * speed

  const size = config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin)

  return {
    id: nextId++,
    x: config.originX ?? 0,
    y: config.originY ?? 0,
    z: config.originZ ?? 0,
    vx,
    vy,
    vz,
    life: config.lifetime,
    maxLife: config.lifetime,
    size,
    trail: [],
  }
}

export class ParticleSystem {
  engine: PhysicsEngine
  particles: ParticleData[] = []

  constructor(engine: PhysicsEngine) {
    this.engine = engine
  }

  emit(config: EmitConfig) {
    for (let i = 0; i < config.count; i++) {
      this.particles.push(createParticle(config))
    }
  }

  update(dt: number): ParticleData[] {
    this.particles = this.engine.step(this.particles, dt)
    return this.particles
  }

  clear() {
    this.particles = []
  }

  getCount(): number {
    return this.particles.length
  }

  applyParticleAttributes(options: UpdateParticlesOptions) {
    if (options.sizeMin !== undefined || options.sizeMax !== undefined) {
      const minSize = options.sizeMin ?? 2
      const maxSize = options.sizeMax ?? 6
      this.particles = this.particles.map((p) => ({
        ...p,
        size: minSize + Math.random() * (maxSize - minSize),
      }))
    }
  }
}
