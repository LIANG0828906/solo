type ParticleType = 'explosion' | 'dissipate' | 'trail'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  type: ParticleType
  angle?: number
  angularVelocity?: number
  radius?: number
  gravity?: number
}

export class ParticleSystem {
  private particles: Particle[] = []
  private readonly maxParticles = 500
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2D context')
    this.ctx = ctx
  }

  addExplosion(x: number, y: number, colors: string[], count = 300): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break

      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
      const speed = 2 + Math.random() * 4
      const color = colors[Math.floor(Math.random() * colors.length)]

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1.5 + Math.random() * 1,
        color,
        size: 2 + Math.random() * 3,
        type: 'explosion',
        angle: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 0.3,
        radius: 0,
        gravity: 0.1,
      })
    }
  }

  addDissipate(x: number, y: number, count = 100): void {
    const colors = ['#808080', '#a0a0a0', '#c0a0d0', '#d0b0e0', '#9370db']

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break

      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.6
      const speed = 1 + Math.random() * 3

      this.particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 2 + Math.random() * 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 1.5 + Math.random() * 2.5,
        type: 'dissipate',
      })
    }
  }

  addTrail(x: number, y: number, color: string): void {
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift()
    }

    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      life: 1,
      maxLife: 0.3 + Math.random() * 0.3,
      color,
      size: 3 + Math.random() * 4,
      type: 'trail',
    })
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life -= dt / p.maxLife

      if (p.life <= 0) {
        this.particles.splice(i, 1)
        continue
      }

      switch (p.type) {
        case 'explosion':
          this.updateExplosion(p, dt)
          break
        case 'dissipate':
          this.updateDissipate(p, dt)
          break
        case 'trail':
          this.updateTrail(p, dt)
          break
      }
    }
  }

  private updateExplosion(p: Particle, dt: number): void {
    if (p.angularVelocity !== undefined && p.angle !== undefined) {
      p.angle += p.angularVelocity * dt * 60
      p.radius = (p.radius ?? 0) + 0.5 * dt * 60
      
      const spiralX = Math.cos(p.angle) * (p.radius ?? 0) * 0.3
      const spiralY = Math.sin(p.angle) * (p.radius ?? 0) * 0.3
      
      p.x += p.vx * dt * 60 + spiralX * dt * 60
      p.y += p.vy * dt * 60 + spiralY * dt * 60
      
      p.vy += (p.gravity ?? 0.1) * dt * 60
      p.vx *= 0.98
      p.vy *= 0.98
    }
  }

  private updateDissipate(p: Particle, dt: number): void {
    p.x += p.vx * dt * 60
    p.y += p.vy * dt * 60
    p.vy -= 0.02 * dt * 60
    p.vx *= 0.99
    p.vy *= 0.995
  }

  private updateTrail(p: Particle, dt: number): void {
    p.x += p.vx * dt * 60
    p.y += p.vy * dt * 60
    p.size *= 0.95
  }

  render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.globalCompositeOperation = 'lighter'

    for (const p of this.particles) {
      const alpha = Math.max(0, p.life)
      const size = p.size * alpha

      this.ctx.save()
      this.ctx.globalAlpha = alpha

      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2)
      gradient.addColorStop(0, p.color)
      gradient.addColorStop(0.4, p.color + '80')
      gradient.addColorStop(1, p.color + '00')

      this.ctx.fillStyle = gradient
      this.ctx.beginPath()
      this.ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2)
      this.ctx.fill()

      this.ctx.fillStyle = p.color
      this.ctx.beginPath()
      this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
      this.ctx.fill()

      this.ctx.restore()
    }

    this.ctx.globalCompositeOperation = 'source-over'
  }

  isActive(): boolean {
    return this.particles.length > 0
  }

  clear(): void {
    this.particles = []
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  resize(width: number, height: number): void {
    this.canvas.width = width
    this.canvas.height = height
  }
}
