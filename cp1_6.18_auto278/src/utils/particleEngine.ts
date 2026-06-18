export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  life: number
  maxLife: number
}

export interface Ripple {
  x: number
  y: number
  radius: number
  maxRadius: number
  life: number
  maxLife: number
}

export interface ParticleSystem {
  particles: Particle[]
  ripples: Ripple[]
  addExplosion: (x: number, y: number, color: string) => void
  addRipple: (x: number, y: number) => void
  update: () => void
  draw: (ctx: CanvasRenderingContext2D) => void
  isAlive: () => boolean
}

export function createParticleSystem(): ParticleSystem {
  const particles: Particle[] = []
  const ripples: Ripple[] = []

  const addExplosion = (x: number, y: number, color: string) => {
    const count = 25 + Math.floor(Math.random() * 6)
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
      const distance = 80 + Math.random() * 40
      const frames = 48
      const speed = distance / frames
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color,
        life: 0,
        maxLife: 48,
      })
    }
  }

  const addRipple = (x: number, y: number) => {
    ripples.push({
      x,
      y,
      radius: 10,
      maxRadius: 150,
      life: 0,
      maxLife: 72,
    })
  }

  const update = () => {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.97
      p.vy *= 0.97
      p.life++
      if (p.life >= p.maxLife) {
        particles.splice(i, 1)
      }
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i]
      r.life++
      r.radius = 10 + (r.maxRadius - 10) * (r.life / r.maxLife)
      if (r.life >= r.maxLife) {
        ripples.splice(i, 1)
      }
    }
  }

  const draw = (ctx: CanvasRenderingContext2D) => {
    for (const p of particles) {
      const alpha = 1 - p.life / p.maxLife
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = hexToRgba(p.color, alpha)
      ctx.shadowColor = p.color
      ctx.shadowBlur = 6
      ctx.fill()
    }
    ctx.shadowBlur = 0
    for (const r of ripples) {
      const progress = r.life / r.maxLife
      const alpha = 0.5 * (1 - progress)
      ctx.beginPath()
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2)
      ctx.strokeStyle = hexToRgba('#667eea', alpha)
      ctx.lineWidth = 2
      ctx.shadowColor = '#667eea'
      ctx.shadowBlur = 12
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(r.x, r.y, r.radius * 0.7, 0, Math.PI * 2)
      ctx.strokeStyle = hexToRgba('#764ba2', alpha * 0.6)
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
    ctx.shadowBlur = 0
  }

  const isAlive = () => particles.length > 0 || ripples.length > 0

  return { particles, ripples, addExplosion, addRipple, update, draw, isAlive }
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
