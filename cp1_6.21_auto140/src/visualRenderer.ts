interface Particle {
  angle: number
  baseAngle: number
  currentRadius: number
  targetRadius: number
  size: number
  color: string
  opacity: number
}

const PARTICLE_COLORS = ['#FF5252', '#FFD740', '#00E5FF']
const PARTICLE_COUNT = 200
const MIN_RADIUS = 80
const MAX_RADIUS = 200
const EASING_DURATION = 0.3

export class VisualRenderer {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private particles: Particle[] = []
  private globalRotation = 0
  private lastTime = 0
  private animationFrameId: number | null = null
  private width = 0
  private height = 0

  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.resize()
    this.initParticles()
  }

  resize(): void {
    if (!this.canvas) return
    const rect = this.canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = rect.width * dpr
    this.canvas.height = rect.height * dpr
    this.width = rect.width
    this.height = rect.height
    if (this.ctx) {
      this.ctx.scale(dpr, dpr)
    }
  }

  private initParticles(): void {
    this.particles = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this.particles.push({
        angle: (Math.PI * 2 * i) / PARTICLE_COUNT,
        baseAngle: (Math.PI * 2 * i) / PARTICLE_COUNT,
        currentRadius: MIN_RADIUS,
        targetRadius: MIN_RADIUS,
        size: 6 + Math.random() * 6,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        opacity: 0.6 + Math.random() * 0.4,
      })
    }
  }

  clear(): void {
    if (!this.ctx || !this.canvas) return

    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height)
    gradient.addColorStop(0, '#1E1E2E')
    gradient.addColorStop(1, '#2D2D3F')

    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  renderWaveform(amplitudeData: Uint8Array): void {
    if (!this.ctx || amplitudeData.length === 0) return

    const ctx = this.ctx
    const w = this.width
    const h = this.height
    const bufferLength = amplitudeData.length

    ctx.beginPath()

    const sliceWidth = w / bufferLength
    let x = 0

    const fillGradient = ctx.createLinearGradient(0, h, 0, h / 2)
    fillGradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)')
    fillGradient.addColorStop(1, 'rgba(34, 197, 94, 0)')

    ctx.moveTo(0, h)

    for (let i = 0; i < bufferLength; i++) {
      const v = amplitudeData[i] / 128.0 - 1.0
      const y = h - (Math.abs(v) * h) / 2 - 20

      if (i === 0) {
        ctx.lineTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    ctx.lineTo(w, h)
    ctx.closePath()
    ctx.fillStyle = fillGradient
    ctx.fill()

    ctx.beginPath()
    x = 0
    for (let i = 0; i < bufferLength; i++) {
      const v = amplitudeData[i] / 128.0 - 1.0
      const y = h - (Math.abs(v) * h) / 2 - 20

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    ctx.strokeStyle = '#22C55E'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }

  renderParticles(lowEnergy: number, highEnergy: number): void {
    if (!this.ctx) return

    const ctx = this.ctx
    const centerX = this.width / 2
    const centerY = this.height / 2.5

    const now = performance.now() / 1000
    const deltaTime = this.lastTime > 0 ? Math.min(now - this.lastTime, 0.1) : 0.016
    this.lastTime = now

    const easingFactor = Math.min(1, deltaTime / EASING_DURATION) * 3

    const rotationSpeed = 0.3 + highEnergy * 3
    this.globalRotation += rotationSpeed * deltaTime

    const targetBaseRadius = MIN_RADIUS + lowEnergy * (MAX_RADIUS - MIN_RADIUS)

    for (const particle of this.particles) {
      particle.targetRadius = targetBaseRadius + (Math.random() - 0.5) * 20
      particle.currentRadius += (particle.targetRadius - particle.currentRadius) * easingFactor

      const angle = particle.baseAngle + this.globalRotation

      const px = centerX + Math.cos(angle) * particle.currentRadius
      const py = centerY + Math.sin(angle) * particle.currentRadius

      ctx.beginPath()
      ctx.arc(px, py, particle.size, 0, Math.PI * 2)
      ctx.fillStyle = particle.color
      ctx.globalAlpha = particle.opacity
      ctx.fill()
      ctx.globalAlpha = 1

      ctx.beginPath()
      ctx.arc(px, py, particle.size * 1.5, 0, Math.PI * 2)
      const glowGradient = ctx.createRadialGradient(px, py, 0, px, py, particle.size * 1.5)
      glowGradient.addColorStop(0, particle.color + '40')
      glowGradient.addColorStop(1, particle.color + '00')
      ctx.fillStyle = glowGradient
      ctx.fill()
    }
  }

  snapshot(): string {
    if (!this.canvas) return ''
    return this.canvas.toDataURL('image/png')
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }
}
