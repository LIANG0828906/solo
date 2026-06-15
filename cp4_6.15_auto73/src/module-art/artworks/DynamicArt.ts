export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  ax: number
  ay: number
  radius: number
  color: string
  baseHue: number
  trail: { x: number; y: number }[]
  maxTrailLength: number
}

export interface DynamicArtConfig {
  colors?: string[]
  particleCount?: number
  particleSpeed?: number
  shapeCount?: number
  backgroundColor?: string
  trailLength?: number
  fps?: number
  seed?: number
  connectionDistance?: number
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
  private seed: number
  private connectionDistance: number

  private mulberry32(seed: number): () => number {
    let t = seed >>> 0
    return function(): number {
      t = (t + 0x6D2B79F5) >>> 0
      let r = Math.imul(t ^ (t >>> 15), 1 | t)
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296
    }
  }

  private seededRandom: () => number

  constructor(canvas: HTMLCanvasElement, config: DynamicArtConfig = {}) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Unable to get 2D context')
    }
    this.ctx = ctx

    this.seed = config.seed ?? Date.now()
    this.seededRandom = this.mulberry32(this.seed)
    this.connectionDistance = config.connectionDistance || 120

    this.colors = config.colors || this.generateUniqueColors()
    this.particleCount = config.particleCount || this.seededRandomInt(30, 45)
    this.particleSpeed = config.particleSpeed || 1
    this.shapeCount = config.shapeCount || this.seededRandomInt(3, 5)
    this.trailLength = config.trailLength || 25
    this.backgroundColor = config.backgroundColor || '#0a0a1a'
    this.frameInterval = 1000 / (config.fps || 60)

    this.resize()
    this.initParticles()
    this.initShapes()
  }

  private generateUniqueColors(): string[] {
    const baseHue = this.seededRandom() * 360
    const colorCount = this.seededRandomInt(5, 8)
    const colors: string[] = []
    
    for (let i = 0; i < colorCount; i++) {
      const hue = (baseHue + (i * 360 / colorCount)) % 360
      const saturation = this.seededRandomInt(60, 90)
      const lightness = this.seededRandomInt(50, 70)
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

  private seededRandomInt(min: number, max: number): number {
    return Math.floor(this.seededRandom() * (max - min + 1)) + min
  }

  private seededRandomFloat(min: number, max: number): number {
    return this.seededRandom() * (max - min) + min
  }

  private getRandomColor(): string {
    return this.colors[Math.floor(Math.random() * this.colors.length)]
  }

  private getSeededRandomColor(): { color: string; hue: number } {
    const index = Math.floor(this.seededRandom() * this.colors.length)
    const color = this.colors[index]
    let hue = 0
    const hslMatch = color.match(/hsl\((\d+)/)
    if (hslMatch) {
      hue = parseInt(hslMatch[1], 10)
    } else {
      hue = (index * 360) / this.colors.length
    }
    return { color, hue }
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
      const { color, hue } = this.getSeededRandomColor()
      const particle: Particle = {
        x: this.seededRandom() * width,
        y: this.seededRandom() * height,
        vx: this.seededRandomFloat(-1, 1) * this.particleSpeed,
        vy: this.seededRandomFloat(-1, 1) * this.particleSpeed,
        ax: this.seededRandomFloat(-0.02, 0.02),
        ay: this.seededRandomFloat(-0.02, 0.02),
        radius: this.seededRandomFloat(2, 5),
        color,
        baseHue: hue,
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
      const size = this.seededRandomFloat(30, 80)
      const { color } = this.getSeededRandomColor()
      const shape: Shape = {
        x: this.seededRandom() * width,
        y: this.seededRandom() * height,
        size,
        rotation: this.seededRandom() * Math.PI * 2,
        rotationSpeed: this.seededRandomFloat(-0.01, 0.01) * ((this.seed % 1000) / 500) * 2,
        type: shapeTypes[Math.floor(this.seededRandom() * shapeTypes.length)],
        color,
        alpha: this.seededRandomFloat(0.1, 0.3),
        growSpeed: this.seededRandomFloat(0.1, 0.3),
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
      const hslMatch = p.color.match(/hsl\((\d+)/)
      if (hslMatch) {
        p.baseHue = parseInt(hslMatch[1], 10)
      }
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
    this.drawConnections()
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

  private drawConnections(): void {
    const particles = this.particles
    const len = particles.length
    const maxDist = this.connectionDistance
    const maxDistSq = maxDist * maxDist

    this.ctx.save()
    this.ctx.lineCap = 'round'

    for (let i = 0; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        const p1 = particles[i]
        const p2 = particles[j]
        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const distSq = dx * dx + dy * dy

        if (distSq < maxDistSq) {
          const dist = Math.sqrt(distSq)
          const alpha = (1 - dist / maxDist) * 0.35

          const hue1 = p1.baseHue
          const hue2 = p2.baseHue
          const midHue = (hue1 + hue2) / 2

          this.ctx.beginPath()
          this.ctx.moveTo(p1.x, p1.y)
          this.ctx.lineTo(p2.x, p2.y)
          this.ctx.strokeStyle = `hsla(${midHue}, 70%, 65%, ${alpha})`
          this.ctx.lineWidth = 1
          this.ctx.stroke()
        }
      }
    }

    this.ctx.restore()
  }

  private drawParticles(): void {
    this.particles.forEach(particle => {
      if (particle.trail.length > 2) {
        const trail = particle.trail
        const segments = trail.length - 1

        this.ctx.save()
        this.ctx.shadowBlur = 15
        this.ctx.shadowColor = particle.color
        this.ctx.lineCap = 'round'
        this.ctx.lineJoin = 'round'

        for (let i = 0; i < segments; i++) {
          const t = i / segments

          const p0 = trail[Math.max(0, i - 1)]
          const p1 = trail[i]
          const p2 = trail[Math.min(segments, i + 1)]
          const p3 = trail[Math.min(segments, i + 2)]

          const alpha = 0.1 + t * 0.8
          const width = (particle.radius * 0.2) + t * (particle.radius * 0.8)
          const hueShift = Math.sin((t + this.gradientPhase * 5) * Math.PI * 2) * 15
          const hue = (particle.baseHue + hueShift + 360) % 360

          this.ctx.beginPath()
          this.ctx.moveTo(p1.x, p1.y)

          const cp1x = p1.x + (p2.x - p0.x) / 6
          const cp1y = p1.y + (p2.y - p0.y) / 6
          const cp2x = p2.x - (p3.x - p1.x) / 6
          const cp2y = p2.y - (p3.y - p1.y) / 6

          this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
          this.ctx.strokeStyle = `hsla(${hue}, 75%, 65%, ${alpha})`
          this.ctx.lineWidth = width
          this.ctx.stroke()
        }

        this.ctx.restore()
      }

      this.ctx.beginPath()
      this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      this.ctx.fillStyle = particle.color
      this.ctx.shadowBlur = 15
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
