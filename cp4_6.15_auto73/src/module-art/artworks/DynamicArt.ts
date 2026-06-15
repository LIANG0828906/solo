export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  ax: number
  ay: number
  radius: number
  color: string
  trail: { x: number; y: number }[]
  maxTrailLength: number
}

export interface Shape {
  x: number
  y: number
  size: number
  rotation: number
  rotationSpeed: number
  type: 'circle' | 'triangle' | 'square' | 'hexagon'
  color: string
  alpha: number
  growSpeed: number
  maxSize: number
  minSize: number
}

export interface DynamicArtConfig {
  colors?: string[]
  particleCount?: number
  particleSpeed?: number
  shapeCount?: number
  backgroundColor?: string
  trailLength?: number
  fps?: number
}

const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
]

export class DynamicArt {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private particles: Particle[] = []
  private shapes: Shape[] = []
  private colors: string[]
  private particleSpeed: number
  private particleCount: number
  private shapeCount: number
  private trailLength: number
  private animationId: number | null = null
  private isRunning: boolean = false
  private lastTime: number = 0
  private frameInterval: number
  private hueOffset: number = 0
  private backgroundColor: string
  private gradientPhase: number = 0
  private uniqueSeed: number = Math.random()

  constructor(canvas: HTMLCanvasElement, config: DynamicArtConfig = {}) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Unable to get 2D context')
    }
    this.ctx = ctx

    this.colors = config.colors || this.generateUniqueColors()
    this.particleCount = config.particleCount || this.randomInt(30, 50)
    this.particleSpeed = config.particleSpeed || 1
    this.shapeCount = config.shapeCount || this.randomInt(3, 6)
    this.trailLength = config.trailLength || 30
    this.backgroundColor = config.backgroundColor || '#0a0a1a'
    this.frameInterval = 1000 / (config.fps || 60)

    this.resize()
    this.initParticles()
    this.initShapes()
  }

  private generateUniqueColors(): string[] {
    const baseHue = this.uniqueSeed * 360
    const colorCount = this.randomInt(5, 8)
    const colors: string[] = []
    
    for (let i = 0; i < colorCount; i++) {
      const hue = (baseHue + (i * 360 / colorCount)) % 360
      const saturation = this.randomInt(60, 90)
      const lightness = this.randomInt(50, 70)
      colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`)
    }
    
    return colors
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  private randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min
  }

  private getRandomColor(): string {
    return this.colors[Math.floor(Math.random() * this.colors.length)]
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1
    const rect = this.canvas.getBoundingClientRect()
    this.canvas.width = rect.width * dpr
    this.canvas.height = rect.height * dpr
    this.ctx.scale(dpr, dpr)
  }

  private initParticles(): void {
    this.particles = []
    const { width, height } = this.canvasDimensions

    for (let i = 0; i < this.particleCount; i++) {
      const particle: Particle = {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: this.randomFloat(-1, 1) * this.particleSpeed,
        vy: this.randomFloat(-1, 1) * this.particleSpeed,
        ax: this.randomFloat(-0.02, 0.02),
        ay: this.randomFloat(-0.02, 0.02),
        radius: this.randomFloat(2, 5),
        color: this.getRandomColor(),
        trail: [],
        maxTrailLength: this.trailLength
      }
      this.particles.push(particle)
    }
  }

  private initShapes(): void {
    this.shapes = []
    const { width, height } = this.canvasDimensions
    const shapeTypes: Shape['type'][] = ['circle', 'triangle', 'square', 'hexagon']

    for (let i = 0; i < this.shapeCount; i++) {
      const size = this.randomFloat(30, 80)
      const shape: Shape = {
        x: Math.random() * width,
        y: Math.random() * height,
        size,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: this.randomFloat(-0.01, 0.01) * this.uniqueSeed * 2,
        type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
        color: this.getRandomColor(),
        alpha: this.randomFloat(0.1, 0.3),
        growSpeed: this.randomFloat(0.1, 0.3),
        maxSize: size * 1.5,
        minSize: size * 0.5
      }
      this.shapes.push(shape)
    }
  }

  private get canvasDimensions(): { width: number; height: number } {
    const rect = this.canvas.getBoundingClientRect()
    return { width: rect.width, height: rect.height }
  }

  updateColors(colors: string[]): void {
    this.colors = colors
    this.particles.forEach(p => {
      p.color = this.getRandomColor()
    })
    this.shapes.forEach(s => {
      s.color = this.getRandomColor()
    })
  }

  updateParticleSpeed(speed: number): void {
    const ratio = speed / this.particleSpeed
    this.particleSpeed = speed
    this.particles.forEach(p => {
      p.vx *= ratio
      p.vy *= ratio
    })
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.lastTime = performance.now()
    this.animate()
  }

  stop(): void {
    this.isRunning = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private animate = (): void => {
    if (!this.isRunning) return

    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastTime

    if (deltaTime >= this.frameInterval) {
      this.lastTime = currentTime - (deltaTime % this.frameInterval)
      this.update()
      this.draw()
    }

    this.animationId = requestAnimationFrame(this.animate)
  }

  private update(): void {
    const { width, height } = this.canvasDimensions

    this.gradientPhase += 0.002
    this.hueOffset = (this.hueOffset + 0.1) % 360

    this.particles.forEach(particle => {
      particle.vx += particle.ax
      particle.vy += particle.ay

      const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy)
      const maxSpeed = this.particleSpeed * 3
      if (speed > maxSpeed) {
        particle.vx = (particle.vx / speed) * maxSpeed
        particle.vy = (particle.vy / speed) * maxSpeed
      }

      if (Math.random() < 0.01) {
        particle.ax = this.randomFloat(-0.03, 0.03)
        particle.ay = this.randomFloat(-0.03, 0.03)
      }

      particle.x += particle.vx
      particle.y += particle.vy

      particle.trail.push({ x: particle.x, y: particle.y })
      if (particle.trail.length > particle.maxTrailLength) {
        particle.trail.shift()
      }

      if (particle.x < 0 || particle.x > width) {
        particle.vx *= -0.8
        particle.x = particle.x < 0 ? 0 : width
      }
      if (particle.y < 0 || particle.y > height) {
        particle.vy *= -0.8
        particle.y = particle.y < 0 ? 0 : height
      }
    })

    this.shapes.forEach(shape => {
      shape.rotation += shape.rotationSpeed
      shape.size += shape.growSpeed * 0.5

      if (shape.size >= shape.maxSize || shape.size <= shape.minSize) {
        shape.growSpeed *= -1
      }

      shape.x += Math.sin(shape.rotation * 2) * 0.3
      shape.y += Math.cos(shape.rotation * 1.5) * 0.3

      if (shape.x < -shape.maxSize) shape.x = width + shape.maxSize
      if (shape.x > width + shape.maxSize) shape.x = -shape.maxSize
      if (shape.y < -shape.maxSize) shape.y = height + shape.maxSize
      if (shape.y > height + shape.maxSize) shape.y = -shape.maxSize
    })
  }

  private draw(): void {
    const { width, height } = this.canvasDimensions

    this.drawBackground(width, height)
    this.drawShapes()
    this.drawParticles()
  }

  private drawBackground(width: number, height: number): void {
    const gradient = this.ctx.createLinearGradient(0, 0, width, height)
    const hue1 = (this.gradientPhase * 30) % 360
    const hue2 = (hue1 + 60) % 360
    
    gradient.addColorStop(0, `hsl(${hue1}, 30%, 8%)`)
    gradient.addColorStop(0.5, `hsl(${hue2}, 25%, 12%)`)
    gradient.addColorStop(1, `hsl(${hue1}, 30%, 6%)`)

    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, width, height)
  }

  private drawShapes(): void {
    this.shapes.forEach(shape => {
      this.ctx.save()
      this.ctx.translate(shape.x, shape.y)
      this.ctx.rotate(shape.rotation)
      this.ctx.globalAlpha = shape.alpha
      this.ctx.strokeStyle = shape.color
      this.ctx.lineWidth = 2

      switch (shape.type) {
        case 'circle':
          this.ctx.beginPath()
          this.ctx.arc(0, 0, shape.size, 0, Math.PI * 2)
          this.ctx.stroke()
          break
        case 'triangle':
          this.drawTriangle(shape.size)
          break
        case 'square':
          this.ctx.strokeRect(-shape.size / 2, -shape.size / 2, shape.size, shape.size)
          break
        case 'hexagon':
          this.drawHexagon(shape.size)
          break
      }

      this.ctx.restore()
    })
  }

  private drawTriangle(size: number): void {
    this.ctx.beginPath()
    this.ctx.moveTo(0, -size)
    this.ctx.lineTo(size * 0.866, size * 0.5)
    this.ctx.lineTo(-size * 0.866, size * 0.5)
    this.ctx.closePath()
    this.ctx.stroke()
  }

  private drawHexagon(size: number): void {
    this.ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i
      const x = size * Math.cos(angle)
      const y = size * Math.sin(angle)
      if (i === 0) {
        this.ctx.moveTo(x, y)
      } else {
        this.ctx.lineTo(x, y)
      }
    }
    this.ctx.closePath()
    this.ctx.stroke()
  }

  private drawParticles(): void {
    this.particles.forEach(particle => {
      if (particle.trail.length > 1) {
        this.ctx.beginPath()
        this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y)

        for (let i = 1; i < particle.trail.length; i++) {
          this.ctx.lineTo(particle.trail[i].x, particle.trail[i].y)
        }

        const gradient = this.ctx.createLinearGradient(
          particle.trail[0].x, particle.trail[0].y,
          particle.x, particle.y
        )
        gradient.addColorStop(0, 'transparent')
        gradient.addColorStop(1, particle.color)

        this.ctx.strokeStyle = gradient
        this.ctx.lineWidth = particle.radius * 0.8
        this.ctx.lineCap = 'round'
        this.ctx.stroke()
      }

      this.ctx.beginPath()
      this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      this.ctx.fillStyle = particle.color
      this.ctx.shadowBlur = 10
      this.ctx.shadowColor = particle.color
      this.ctx.fill()
      this.ctx.shadowBlur = 0
    })
  }

  getThumbnail(width: number = 200, height: number = 200): string {
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = height
    const tempCtx = tempCanvas.getContext('2d')

    if (!tempCtx) {
      return ''
    }

    const { width: srcWidth, height: srcHeight } = this.canvasDimensions
    const scale = Math.min(width / srcWidth, height / srcHeight)
    const destWidth = srcWidth * scale
    const destHeight = srcHeight * scale
    const destX = (width - destWidth) / 2
    const destY = (height - destHeight) / 2

    tempCtx.drawImage(
      this.canvas,
      0, 0, this.canvas.width, this.canvas.height,
      destX, destY, destWidth, destHeight
    )

    return tempCanvas.toDataURL('image/png')
  }

  getIsRunning(): boolean {
    return this.isRunning
  }

  destroy(): void {
    this.stop()
    this.particles = []
    this.shapes = []
  }
}
