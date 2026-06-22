export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  life: number
  maxLife: number
  rotation?: number
  rotationSpeed?: number
}

export class ParticleSystem {
  private particles: Particle[] = []
  private ctx: CanvasRenderingContext2D | null = null
  private canvas: HTMLCanvasElement | null = null
  private animationId: number | null = null
  private maxParticles: number = 100

  setCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
  }

  spawnUnlockParticles(x: number, y: number, color: string, count: number = 50) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 4
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color,
        alpha: 1,
        life: 60 + Math.random() * 40,
        maxLife: 100,
      })
    }
  }

  spawnCollectParticles(x: number, y: number, targetX: number, targetY: number, color: string) {
    for (let i = 0; i < 20; i++) {
      if (this.particles.length >= this.maxParticles) break
      const angle = Math.random() * Math.PI * 2
      const offsetX = Math.cos(angle) * 20
      const offsetY = Math.sin(angle) * 20
      const dx = targetX - (x + offsetX)
      const dy = targetY - (y + offsetY)
      const dist = Math.sqrt(dx * dx + dy * dy)
      const speed = 3
      this.particles.push({
        x: x + offsetX,
        y: y + offsetY,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        size: 1.5 + Math.random() * 2,
        color,
        alpha: 1,
        life: 80,
        maxLife: 80,
      })
    }
  }

  spawnShatterParticles(fragments: Array<{
    x: number
    y: number
    width: number
    height: number
    vx: number
    vy: number
    rotation: number
    rotationSpeed: number
  }>) {
    fragments.forEach((f) => {
      if (this.particles.length >= this.maxParticles) return
      this.particles.push({
        x: f.x,
        y: f.y,
        vx: f.vx,
        vy: f.vy,
        size: Math.max(f.width, f.height),
        color: '#ffffff',
        alpha: 1,
        life: 120,
        maxLife: 120,
        rotation: f.rotation,
        rotationSpeed: f.rotationSpeed,
      })
    })
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.02
      p.life--
      p.alpha = p.life / p.maxLife
      if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
        p.rotation += p.rotationSpeed
      }
      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  render() {
    if (!this.ctx || !this.canvas) return
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    for (const p of this.particles) {
      this.ctx.save()
      this.ctx.globalAlpha = p.alpha
      this.ctx.fillStyle = p.color
      this.ctx.shadowBlur = 10
      this.ctx.shadowColor = p.color
      this.ctx.beginPath()
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      this.ctx.fill()
      this.ctx.restore()
    }
  }

  animate() {
    this.update()
    this.render()
    this.animationId = requestAnimationFrame(() => this.animate())
  }

  start() {
    if (!this.animationId) {
      this.animate()
    }
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  clear() {
    this.particles = []
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }
  }

  getParticleCount(): number {
    return this.particles.length
  }
}
