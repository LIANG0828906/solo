export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  type: 'fire' | 'spark' | 'frost' | 'wind' | 'shadow' | 'lightning'
  alpha: number
  rotation: number
  rotationSpeed: number
}

interface SpellEffectOptions {
  centerX: number
  centerY: number
  spellId: string
  color: string
}

export class ParticleSystem {
  private particles: Particle[] = []
  private readonly maxParticles: number = 500
  private lightningBoltPaths: { points: { x: number; y: number }[]; alpha: number; life: number; maxLife: number }[] = []

  addSpellEffect(options: SpellEffectOptions): void {
    const { centerX, centerY, spellId, color } = options

    switch (spellId) {
      case 'fireball':
        this.createFireballEffect(centerX, centerY, color)
        break
      case 'lightning':
        this.createLightningEffect(centerX, centerY, color)
        break
      case 'frost':
        this.createFrostEffect(centerX, centerY, color)
        break
      case 'wind':
        this.createWindEffect(centerX, centerY, color)
        break
      case 'shadow':
        this.createShadowEffect(centerX, centerY, color)
        break
    }
  }

  private createFireballEffect(centerX: number, centerY: number, color: string): void {
    const count = Math.min(150, this.maxParticles - this.particles.length)

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 8
      const dist = Math.random() * 50

      this.particles.push({
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 60 + Math.random() * 60,
        size: 3 + Math.random() * 8,
        color,
        type: 'fire',
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      })
    }

    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 6 + Math.random() * 12

      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 30 + Math.random() * 30,
        size: 2 + Math.random() * 4,
        color: '#ffdd88',
        type: 'spark',
        alpha: 1,
        rotation: 0,
        rotationSpeed: 0
      })
    }
  }

  private createLightningEffect(centerX: number, centerY: number, _color: string): void {
    const boltCount = 5 + Math.floor(Math.random() * 4)

    for (let i = 0; i < boltCount; i++) {
      const angle = (i / boltCount) * Math.PI * 2 + Math.random() * 0.5
      const length = 150 + Math.random() * 150
      const points: { x: number; y: number }[] = [{ x: centerX, y: centerY }]

      let currentX = centerX
      let currentY = centerY
      const segments = 6 + Math.floor(Math.random() * 4)

      for (let j = 1; j <= segments; j++) {
        const progress = j / segments
        const offsetAngle = angle + (Math.random() - 0.5) * 0.8
        const segmentLength = (length / segments) * (0.7 + Math.random() * 0.6)

        currentX += Math.cos(offsetAngle) * segmentLength
        currentY += Math.sin(offsetAngle) * segmentLength

        points.push({ x: currentX, y: currentY })

        if (progress > 0.3 && Math.random() > 0.6) {
          const branchAngle = angle + (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.5)
          const branchLength = length * (1 - progress) * 0.5
          let bx = currentX
          let by = currentY

          for (let k = 0; k < 3; k++) {
            bx += Math.cos(branchAngle + (Math.random() - 0.5) * 0.5) * (branchLength / 3)
            by += Math.sin(branchAngle + (Math.random() - 0.5) * 0.5) * (branchLength / 3)
            points.push({ x: bx, y: by })
          }
        }
      }

      this.lightningBoltPaths.push({
        points,
        alpha: 1,
        life: 1,
        maxLife: 40 + Math.random() * 20
      })
    }

    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 3 + Math.random() * 6
      const dist = Math.random() * 80

      this.particles.push({
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 25 + Math.random() * 25,
        size: 2 + Math.random() * 3,
        color: '#ffffff',
        type: 'spark',
        alpha: 1,
        rotation: 0,
        rotationSpeed: 0
      })
    }
  }

  private createFrostEffect(centerX: number, centerY: number, color: string): void {
    const count = Math.min(120, this.maxParticles - this.particles.length)

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1.5 + Math.random() * 5
      const dist = Math.random() * 40

      this.particles.push({
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 0.5,
        life: 1,
        maxLife: 80 + Math.random() * 60,
        size: 4 + Math.random() * 6,
        color,
        type: 'frost',
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.15
      })
    }

    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 4 + Math.random() * 8

      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 30 + Math.random() * 30,
        size: 1.5 + Math.random() * 3,
        color: '#ffffff',
        type: 'spark',
        alpha: 1,
        rotation: 0,
        rotationSpeed: 0
      })
    }
  }

  private createWindEffect(centerX: number, centerY: number, color: string): void {
    const count = Math.min(100, this.maxParticles - this.particles.length)

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 5 + Math.random() * 10
      const dist = Math.random() * 30

      this.particles.push({
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.3,
        life: 1,
        maxLife: 40 + Math.random() * 40,
        size: 3 + Math.random() * 5,
        color,
        type: 'wind',
        alpha: 0.8,
        rotation: Math.atan2(Math.sin(angle) * 0.3, Math.cos(angle)),
        rotationSpeed: 0
      })
    }

    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 8 + Math.random() * 6

      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.2,
        life: 1,
        maxLife: 50 + Math.random() * 30,
        size: 8 + Math.random() * 12,
        color: '#aaffaa',
        type: 'wind',
        alpha: 0.6,
        rotation: Math.atan2(Math.sin(angle) * 0.2, Math.cos(angle)),
        rotationSpeed: 0
      })
    }
  }

  private createShadowEffect(centerX: number, centerY: number, color: string): void {
    const count = Math.min(130, this.maxParticles - this.particles.length)

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 6
      const dist = Math.random() * 60

      this.particles.push({
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1,
        maxLife: 70 + Math.random() * 50,
        size: 4 + Math.random() * 7,
        color,
        type: 'shadow',
        alpha: 0.9,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1
      })
    }

    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 3

      this.particles.push({
        x: centerX + Math.cos(angle) * 100,
        y: centerY + Math.sin(angle) * 100,
        vx: -Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed,
        life: 1,
        maxLife: 60 + Math.random() * 40,
        size: 5 + Math.random() * 8,
        color: '#553388',
        type: 'shadow',
        alpha: 0.7,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      })
    }
  }

  update(): void {
    this.particles = this.particles.filter(p => {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.02
      p.vx *= 0.98
      p.life -= 1 / p.maxLife
      p.alpha = p.life
      p.rotation += p.rotationSpeed

      if (p.type === 'fire') {
        p.vy -= 0.08
        p.size *= 0.99
      }

      return p.life > 0
    })

    this.lightningBoltPaths = this.lightningBoltPaths.filter(bolt => {
      bolt.life -= 1 / bolt.maxLife
      bolt.alpha = bolt.life
      return bolt.life > 0
    })

    if (this.particles.length > this.maxParticles) {
      this.particles = this.particles.slice(-this.maxParticles)
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      ctx.save()
      ctx.globalAlpha = particle.alpha
      ctx.translate(particle.x, particle.y)
      ctx.rotate(particle.rotation)

      switch (particle.type) {
        case 'fire':
          this.renderFireParticle(ctx, particle)
          break
        case 'spark':
          this.renderSparkParticle(ctx, particle)
          break
        case 'frost':
          this.renderFrostParticle(ctx, particle)
          break
        case 'wind':
          this.renderWindParticle(ctx, particle)
          break
        case 'shadow':
          this.renderShadowParticle(ctx, particle)
          break
      }

      ctx.restore()
    }

    for (const bolt of this.lightningBoltPaths) {
      this.renderLightningBolt(ctx, bolt)
    }
  }

  private renderFireParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size)
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(0.3, p.color)
    gradient.addColorStop(1, 'rgba(255, 100, 0, 0)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, p.size, 0, Math.PI * 2)
    ctx.fill()
  }

  private renderSparkParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(0, 0, p.size, 0, Math.PI * 2)
    ctx.fill()
  }

  private renderFrostParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
    ctx.strokeStyle = p.color
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(Math.cos(angle) * p.size, Math.sin(angle) * p.size)
      ctx.stroke()

      const midX = Math.cos(angle) * p.size * 0.6
      const midY = Math.sin(angle) * p.size * 0.6
      const branchAngle = angle + Math.PI / 3
      ctx.beginPath()
      ctx.moveTo(midX, midY)
      ctx.lineTo(
        midX + Math.cos(branchAngle) * p.size * 0.3,
        midY + Math.sin(branchAngle) * p.size * 0.3
      )
      ctx.stroke()
    }
  }

  private renderWindParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
    const gradient = ctx.createLinearGradient(-p.size, 0, p.size, 0)
    gradient.addColorStop(0, 'rgba(255,255,255,0)')
    gradient.addColorStop(0.5, p.color)
    gradient.addColorStop(1, 'rgba(255,255,255,0)')

    ctx.fillStyle = gradient
    ctx.fillRect(-p.size, -p.size * 0.15, p.size * 2, p.size * 0.3)
  }

  private renderShadowParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size)
    gradient.addColorStop(0, p.color)
    gradient.addColorStop(0.5, 'rgba(100, 50, 150, 0.5)')
    gradient.addColorStop(1, 'rgba(50, 20, 80, 0)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, p.size, 0, Math.PI * 2)
    ctx.fill()
  }

  private renderLightningBolt(
    ctx: CanvasRenderingContext2D,
    bolt: { points: { x: number; y: number }[]; alpha: number }
  ): void {
    if (bolt.points.length < 2) return

    ctx.save()
    ctx.globalAlpha = bolt.alpha

    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.shadowColor = '#ffee66'
    ctx.shadowBlur = 20

    ctx.beginPath()
    ctx.moveTo(bolt.points[0].x, bolt.points[0].y)
    for (let i = 1; i < bolt.points.length; i++) {
      ctx.lineTo(bolt.points[i].x, bolt.points[i].y)
    }
    ctx.stroke()

    ctx.strokeStyle = '#ffee66'
    ctx.lineWidth = 1.5
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.moveTo(bolt.points[0].x, bolt.points[0].y)
    for (let i = 1; i < bolt.points.length; i++) {
      ctx.lineTo(bolt.points[i].x, bolt.points[i].y)
    }
    ctx.stroke()

    ctx.restore()
  }

  clear(): void {
    this.particles = []
    this.lightningBoltPaths = []
  }

  getParticleCount(): number {
    return this.particles.length
  }
}
