import type { Particle } from '@/types'

const MAX_PARTICLES = 150

export class ParticlePool {
  private pool: Particle[] = []
  private activeCount = 0

  constructor() {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.pool.push({
        x: 0, y: 0, vx: 0, vy: 0,
        size: 2, r: 255, g: 255, b: 255,
        life: 0, maxLife: 1000, active: false,
      })
    }
  }

  spawn(
    x: number, y: number,
    vx: number, vy: number,
    size: number,
    r: number, g: number, b: number,
    maxLife: number,
  ): void {
    if (this.activeCount >= MAX_PARTICLES) return
    for (const p of this.pool) {
      if (!p.active) {
        p.x = x
        p.y = y
        p.vx = vx
        p.vy = vy
        p.size = size
        p.r = r
        p.g = g
        p.b = b
        p.life = maxLife
        p.maxLife = maxLife
        p.active = true
        this.activeCount++
        return
      }
    }
  }

  update(deltaMs: number): void {
    const dt = deltaMs / 1000
    for (const p of this.pool) {
      if (!p.active) continue
      p.life -= deltaMs
      if (p.life <= 0) {
        p.active = false
        this.activeCount--
        continue
      }
      p.x += p.vx * dt
      p.y += p.vy * dt
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.pool) {
      if (!p.active) continue
      const alpha = Math.max(0, p.life / p.maxLife)
      ctx.globalAlpha = alpha
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  getActiveParticles(): readonly Particle[] {
    return this.pool.filter(p => p.active)
  }

  clear(): void {
    for (const p of this.pool) {
      p.active = false
    }
    this.activeCount = 0
  }
}

export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return [255, 255, 255]
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
}

export function lerpColor(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
  t: number,
): [number, number, number] {
  return [
    Math.round(r1 + (r2 - r1) * t),
    Math.round(g1 + (g2 - g1) * t),
    Math.round(b1 + (b2 - b1) * t),
  ]
}
