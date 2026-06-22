const ctx: Worker = self as any

interface ParticleData {
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

interface PhysicsParams {
  gravity: number
  windX: number
  windY: number
  windZ: number
  drag: number
  restitution: number
  trailLength: number
}

const params: PhysicsParams = {
  gravity: 9.8,
  windX: 1,
  windY: 0,
  windZ: 0,
  drag: 0.02,
  restitution: 0.5,
  trailLength: 20,
}

let particles: ParticleData[] = []
let nextId = 0

function step(dt: number): ParticleData[] {
  const { gravity, windX, windY, windZ, drag, restitution, trailLength } = params
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
      x, y, z, vx, vy, vz,
      life,
      trail: newTrail,
    })
  }

  particles = result
  return particles
}

function emit(config: { count: number; sizeMin: number; sizeMax: number; lifetime: number; originX?: number; originY?: number; originZ?: number }) {
  for (let i = 0; i < config.count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    const speed = 3 + Math.random() * 5

    const vx = Math.sin(phi) * Math.cos(theta) * speed
    const vy = Math.cos(phi) * speed + 2
    const vz = Math.sin(phi) * Math.sin(theta) * speed

    const size = config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin)

    particles.push({
      id: nextId++,
      x: config.originX ?? 0,
      y: config.originY ?? 0,
      z: config.originZ ?? 0,
      vx, vy, vz,
      life: config.lifetime,
      maxLife: config.lifetime,
      size,
      trail: [],
    })
  }
}

function applyAttributes(options: { sizeMin?: number; sizeMax?: number }) {
  if (options.sizeMin !== undefined || options.sizeMax !== undefined) {
    const minSize = options.sizeMin ?? 2
    const maxSize = options.sizeMax ?? 6
    particles = particles.map((p) => ({
      ...p,
      size: minSize + Math.random() * (maxSize - minSize),
    }))
  }
}

ctx.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data

  switch (type) {
    case 'emit': {
      emit(payload)
      ctx.postMessage({ type: 'count', payload: { count: particles.length } })
      break
    }

    case 'update': {
      const { dt } = payload
      step(dt)
      ctx.postMessage({
        type: 'particles',
        payload: {
          particles,
          count: particles.length,
        },
      })
      break
    }

    case 'setParams': {
      Object.assign(params, payload)
      break
    }

    case 'clear': {
      particles = []
      ctx.postMessage({ type: 'count', payload: { count: 0 } })
      break
    }

    case 'applyAttributes': {
      applyAttributes(payload)
      ctx.postMessage({ type: 'applied', payload: { count: particles.length } })
      break
    }
  }
}

export {}
