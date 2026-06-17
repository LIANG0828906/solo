import { PARTICLE_CONFIG, STAR_CONFIG, COLORS, CANVAS_CONFIG } from '@/config/constants'

interface ParticleParams {
  hueShift: number
  particleCount: number
}

interface Star {
  x: number
  y: number
  size: number
  brightness: number
  period: number
  phase: number
}

class Particle {
  x: number
  y: number
  radius: number
  baseRadius: number
  color: string
  velocity: { x: number; y: number }
  band: 'low' | 'mid' | 'high'
  phase: number

  constructor(width: number, height: number, band: 'low' | 'mid' | 'high') {
    this.x = Math.random() * width
    this.y = Math.random() * height
    this.baseRadius = PARTICLE_CONFIG.MIN_RADIUS + Math.random() * (PARTICLE_CONFIG.MAX_RADIUS - PARTICLE_CONFIG.MIN_RADIUS)
    this.radius = this.baseRadius
    this.band = band
    this.velocity = { x: 0, y: 0 }
    this.phase = Math.random() * Math.PI * 2
    this.color = this.getBandColor(band, 0)
  }

  private getBandColor(band: 'low' | 'mid' | 'high', intensity: number): string {
    const t = intensity
    switch (band) {
      case 'low':
        return this.lerpColor(COLORS.LOW_FREQ_START, COLORS.LOW_FREQ_END, t)
      case 'mid':
        return this.lerpColor(COLORS.MID_FREQ_START, COLORS.MID_FREQ_END, t)
      case 'high':
        return this.lerpColor(COLORS.HIGH_FREQ_START, COLORS.HIGH_FREQ_END, t)
    }
  }

  private lerpColor(color1: string, color2: string, t: number): string {
    const c1 = this.hexToRgb(color1)
    const c2 = this.hexToRgb(color2)
    const r = Math.round(c1.r + (c2.r - c1.r) * t)
    const g = Math.round(c1.g + (c2.g - c1.g) * t)
    const b = Math.round(c1.b + (c2.b - c1.b) * t)
    return `rgb(${r}, ${g}, ${b})`
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 }
  }

  update(
    width: number,
    height: number,
    energy: number,
    bandEnergy: number,
    hueShift: number
  ): void {
    const speed = energy * PARTICLE_CONFIG.VELOCITY_SCALE * 2
    const brownian = PARTICLE_CONFIG.BROWNIAN_RANGE

    this.velocity.x += (Math.random() - 0.5) * brownian * 0.1
    this.velocity.y += (Math.random() - 0.5) * brownian * 0.1
    this.velocity.x *= 0.95
    this.velocity.y *= 0.95

    this.x += this.velocity.x * speed
    this.y += this.velocity.y * speed

    if (this.x < 0) this.x = width
    if (this.x > width) this.x = 0
    if (this.y < 0) this.y = height
    if (this.y > height) this.y = 0

    this.radius = this.baseRadius * (1 + bandEnergy * 2)
    this.color = this.getBandColor(this.band, bandEnergy)
    this.color = this.applyHueShift(this.color, hueShift)
  }

  private applyHueShift(color: string, shift: number): string {
    const rgb = this.hexToRgb(color.startsWith('#') ? color : `#${this.rgbToHex(color)}`)
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b)
    hsl.h = (hsl.h + shift / 360 + 1) % 1
    const newRgb = this.hslToRgb(hsl.h, hsl.s, hsl.l)
    return `rgb(${Math.round(newRgb.r)}, ${Math.round(newRgb.g)}, ${Math.round(newRgb.b)})`
  }

  private rgbToHex(color: string): string {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (!match) return 'ffffff'
    const r = parseInt(match[1]).toString(16).padStart(2, '0')
    const g = parseInt(match[2]).toString(16).padStart(2, '0')
    const b = parseInt(match[3]).toString(16).padStart(2, '0')
    return r + g + b
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255
    g /= 255
    b /= 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6
          break
        case g:
          h = ((b - r) / d + 2) / 6
          break
        case b:
          h = ((r - g) / d + 4) / 6
          break
      }
    }
    return { h, s, l }
  }

  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    let r, g, b

    if (s === 0) {
      r = g = b = l
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      }

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1 / 3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1 / 3)
    }

    return { r: r * 255, g: g * 255, b: b * 255 }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fillStyle = this.color
    ctx.globalAlpha = 0.8
    ctx.fill()
    ctx.globalAlpha = 1
  }
}

export class Visualizer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private particles: Particle[] = []
  private stars: Star[] = []
  private animationId: number | null = null
  private isRunning: boolean = false
  private params: ParticleParams = {
    hueShift: 0,
    particleCount: PARTICLE_CONFIG.DEFAULT_COUNT,
  }
  private audioData: {
    spectrum: Float32Array
    waveform: Float32Array
    energy: number
    lowEnergy: number
    midEnergy: number
    highEnergy: number
  } = {
    spectrum: new Float32Array(256),
    waveform: new Float32Array(256),
    energy: 0,
    lowEnergy: 0,
    midEnergy: 0,
    highEnergy: 0,
  }
  private time: number = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Cannot get 2D context')
    this.ctx = ctx
    this.initStars()
    this.initParticles()
  }

  private initStars(): void {
    const { width, height } = this.canvas
    this.stars = []
    for (let i = 0; i < STAR_CONFIG.COUNT; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: STAR_CONFIG.MIN_SIZE + Math.random() * (STAR_CONFIG.MAX_SIZE - STAR_CONFIG.MIN_SIZE),
        brightness: Math.random(),
        period: STAR_CONFIG.MIN_PERIOD + Math.random() * (STAR_CONFIG.MAX_PERIOD - STAR_CONFIG.MIN_PERIOD),
        phase: Math.random() * Math.PI * 2,
      })
    }
  }

  private initParticles(): void {
    const { width, height } = this.canvas
    this.particles = []
    const count = this.params.particleCount

    for (let i = 0; i < count; i++) {
      const rand = Math.random()
      let band: 'low' | 'mid' | 'high'
      if (rand < 0.3) band = 'low'
      else if (rand < 0.7) band = 'mid'
      else band = 'high'

      this.particles.push(new Particle(width, height, band))
    }
  }

  setParams(params: Partial<ParticleParams>): void {
    const oldCount = this.params.particleCount
    this.params = { ...this.params, ...params }

    if (params.particleCount !== undefined && params.particleCount !== oldCount) {
      this.updateParticleCount(params.particleCount)
    }
  }

  private updateParticleCount(newCount: number): void {
    const { width, height } = this.canvas

    if (newCount > this.particles.length) {
      while (this.particles.length < newCount) {
        const rand = Math.random()
        let band: 'low' | 'mid' | 'high'
        if (rand < 0.3) band = 'low'
        else if (rand < 0.7) band = 'mid'
        else band = 'high'
        this.particles.push(new Particle(width, height, band))
      }
    } else if (newCount < this.particles.length) {
      this.particles = this.particles.slice(0, newCount)
    }
  }

  updateAudioData(
    spectrum: Float32Array,
    waveform: Float32Array,
    energy: number,
    lowEnergy: number,
    midEnergy: number,
    highEnergy: number
  ): void {
    this.audioData = {
      spectrum,
      waveform,
      energy,
      lowEnergy,
      midEnergy,
      highEnergy,
    }
  }

  setSize(width: number, height: number): void {
    this.canvas.width = width
    this.canvas.height = height
    this.initStars()
    for (const p of this.particles) {
      if (p.x > width) p.x = Math.random() * width
      if (p.y > height) p.y = Math.random() * height
    }
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
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

    this.time += 1 / 60
    this.render()

    this.animationId = requestAnimationFrame(this.animate)
  }

  private render(): void {
    const { width, height } = this.canvas
    const ctx = this.ctx

    ctx.fillStyle = CANVAS_CONFIG.BACKGROUND_COLOR
    ctx.fillRect(0, 0, width, height)

    this.drawStars()
    this.drawParticles()
  }

  private drawStars(): void {
    const ctx = this.ctx

    for (const star of this.stars) {
      const brightness = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(this.time * (2 * Math.PI / star.period) + star.phase))
      
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.8})`
      ctx.fill()
    }
  }

  private drawParticles(): void {
    const ctx = this.ctx
    const { width, height } = this.canvas
    const { energy, lowEnergy, midEnergy, highEnergy, hueShift } = {
      ...this.audioData,
      hueShift: this.params.hueShift,
    }

    for (const particle of this.particles) {
      let bandEnergy: number
      switch (particle.band) {
        case 'low':
          bandEnergy = lowEnergy
          break
        case 'mid':
          bandEnergy = midEnergy
          break
        case 'high':
          bandEnergy = highEnergy
          break
      }

      particle.update(width, height, energy, bandEnergy, hueShift)
      particle.draw(ctx)
    }
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  captureImage(): string {
    return this.canvas.toDataURL('image/png')
  }

  destroy(): void {
    this.stop()
  }
}
