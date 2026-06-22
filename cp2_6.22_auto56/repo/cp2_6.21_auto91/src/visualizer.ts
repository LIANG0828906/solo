import type { ThemeConfig } from './themeConfig'
import { defaultTheme } from './themeConfig'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  baseColor: string
  color: string
  life: number
  maxLife: number
  baseX: number
  baseY: number
  frequencyIndex: number
}

interface SpectrumData {
  frequencies: number[]
  waveform: number[]
  beatIntensity: number
}

export class Visualizer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private theme: ThemeConfig = defaultTheme
  private data: SpectrumData = {
    frequencies: [],
    waveform: [],
    beatIntensity: 0,
  }
  private barCount = 32
  private particleCount = 100
  private particles: Particle[] = []
  private animationFrameId: number | null = null
  private width = 0
  private height = 0
  private pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  private isRunning = false
  private prevFrequencies: number[] = []

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Cannot get 2d context')
    this.ctx = ctx
    this.initParticles()
  }

  setTheme(theme: ThemeConfig): void {
    this.theme = theme
    this.updateParticleColors()
  }

  setData(data: SpectrumData): void {
    this.data = data
  }

  setBarCount(count: number): void {
    this.barCount = count
  }

  setParticleCount(count: number): void {
    this.particleCount = count
    this.initParticles()
  }

  resize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.canvas.width = width * this.pixelRatio
    this.canvas.height = height * this.pixelRatio
    this.canvas.style.width = width + 'px'
    this.canvas.style.height = height + 'px'
    this.ctx.scale(this.pixelRatio, this.pixelRatio)
    this.initParticles()
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.animate()
  }

  stop(): void {
    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  destroy(): void {
    this.stop()
  }

  private initParticles(): void {
    this.particles = []
    const positions = this.generateParticlePositions()

    for (let i = 0; i < this.particleCount; i++) {
      const pos = positions[i % positions.length]
      const baseColor = this.theme.particleColors[i % this.theme.particleColors.length]
      const frequencyIndex = Math.floor(Math.random() * this.barCount)
      this.particles.push({
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
        size: 3 + Math.random() * 5,
        baseColor,
        color: baseColor,
        life: Math.random() * 100 + 100,
        maxLife: 200,
        baseX: pos.x,
        baseY: pos.y,
        frequencyIndex,
      })
    }
  }

  private generateParticlePositions(): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = []
    const w = this.width || 800
    const h = this.height || 500
    const pad = 40

    const cornerCount = Math.ceil(this.particleCount * 0.15)
    const centerCount = Math.ceil(this.particleCount * 0.4)
    const edgeCount = Math.ceil(this.particleCount * 0.3)

    const corners = [
      { x: pad, y: pad },
      { x: w - pad, y: pad },
      { x: pad, y: h - pad - 100 },
      { x: w - pad, y: h - pad - 100 },
    ]

    for (const corner of corners) {
      for (let i = 0; i < cornerCount / 4; i++) {
        positions.push({
          x: corner.x + (Math.random() - 0.5) * 60,
          y: corner.y + (Math.random() - 0.5) * 60,
        })
      }
    }

    for (let i = 0; i < centerCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * Math.min(w, h) * 0.25
      positions.push({
        x: w / 2 + Math.cos(angle) * radius,
        y: h / 2 + Math.sin(angle) * radius * 0.8,
      })
    }

    for (let i = 0; i < edgeCount; i++) {
      const side = Math.floor(Math.random() * 4)
      if (side === 0) {
        positions.push({ x: Math.random() * w, y: pad + Math.random() * 50 })
      } else if (side === 1) {
        positions.push({ x: Math.random() * w, y: h - pad - 100 - Math.random() * 50 })
      } else if (side === 2) {
        positions.push({ x: pad + Math.random() * 30, y: Math.random() * (h - 120) })
      } else {
        positions.push({ x: w - pad - Math.random() * 30, y: Math.random() * (h - 120) })
      }
    }

    return positions
  }

  private updateParticleColors(): void {
    for (let i = 0; i < this.particles.length; i++) {
      const baseColor = this.theme.particleColors[i % this.theme.particleColors.length]
      this.particles[i].baseColor = baseColor
      this.particles[i].color = baseColor
    }
  }

  private animate = (): void => {
    if (!this.isRunning) return
    this.render()
    this.animationFrameId = requestAnimationFrame(this.animate)
  }

  private render(): void {
    const ctx = this.ctx
    const w = this.width
    const h = this.height

    ctx.clearRect(0, 0, w, h)

    this.drawBackground(ctx, w, h)
    this.drawBars(ctx, w, h)
    this.drawWaveform(ctx, w, h)
    this.updateAndDrawParticles(ctx, w, h)
  }

  private drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7)
    gradient.addColorStop(0, this.theme.background.inner)
    gradient.addColorStop(1, this.theme.background.outer)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)
  }

  private drawBars(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const frequencies = this.data.frequencies
    if (frequencies.length === 0) {
      for (let i = 0; i < this.barCount; i++) {
        if (this.prevFrequencies[i] === undefined) this.prevFrequencies[i] = 0
        this.prevFrequencies[i] *= 0.95
      }
    } else {
      for (let i = 0; i < this.barCount; i++) {
        const target = frequencies[i] || 0
        const prev = this.prevFrequencies[i] || 0
        this.prevFrequencies[i] = prev + (target - prev) * 0.3
      }
    }

    const barAreaHeight = h * 0.35
    const barBottom = h - 20
    const totalGap = w * 0.08
    const barWidth = (w - totalGap) / this.barCount
    const gap = totalGap / (this.barCount - 1 || 1)

    for (let i = 0; i < this.barCount; i++) {
      const value = this.prevFrequencies[i] || 0
      const barHeight = Math.max(2, value * barAreaHeight)
      const x = i * (barWidth + gap)
      const y = barBottom - barHeight

      const colorIndex = Math.floor((i / (this.barCount - 1 || 1)) * (this.theme.barGradient.length - 1))
      const nextColorIndex = Math.min(colorIndex + 1, this.theme.barGradient.length - 1)
      const t = (i / (this.barCount - 1 || 1)) * (this.theme.barGradient.length - 1) - colorIndex

      const color = this.interpolateColor(
        this.theme.barGradient[colorIndex],
        this.theme.barGradient[nextColorIndex],
        t
      )

      ctx.save()
      ctx.shadowColor = color
      ctx.shadowBlur = 30 * value + 15
      ctx.shadowOffsetY = -5

      const gradient = ctx.createLinearGradient(x, barBottom, x, y)
      gradient.addColorStop(0, color + '80')
      gradient.addColorStop(0.5, color)
      gradient.addColorStop(1, this.brightenColor(color, 0.3))

      ctx.fillStyle = gradient
      this.drawRoundedRect(ctx, x, y, barWidth, barHeight, 3)
      ctx.fill()
      ctx.restore()
    }
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    const r = Math.min(radius, width / 2, height / 2)
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + width - r, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + r)
    ctx.lineTo(x + width, y + height - r)
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
    ctx.lineTo(x + r, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  private drawWaveform(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const waveform = this.data.waveform
    if (waveform.length === 0) return

    const waveY = h * 0.45
    const waveAmplitude = h * 0.18
    const samples = waveform.length

    ctx.save()
    ctx.shadowColor = this.theme.glowColor
    ctx.shadowBlur = 60
    ctx.shadowOffsetY = 8

    ctx.beginPath()
    ctx.moveTo(0, waveY)

    for (let i = 0; i < samples; i++) {
      const x = (i / (samples - 1)) * w
      const y = waveY + waveform[i] * waveAmplitude

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        const prevX = ((i - 1) / (samples - 1)) * w
        const prevY = waveY + waveform[i - 1] * waveAmplitude
        const cpX = (prevX + x) / 2
        ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2)
      }
    }
    ctx.lineTo(w, waveY)

    ctx.strokeStyle = this.theme.waveformColor
    ctx.lineWidth = 2.5
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.globalAlpha = 0.4
    ctx.shadowColor = this.theme.glowColor
    ctx.shadowBlur = 90
    ctx.shadowOffsetY = 15

    const gradient = ctx.createLinearGradient(0, waveY - waveAmplitude, 0, waveY + waveAmplitude * 1.5)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.12)')
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.04)')
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.08)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.02)')

    ctx.beginPath()
    ctx.moveTo(0, waveY)
    for (let i = 0; i < samples; i++) {
      const x = (i / (samples - 1)) * w
      const y = waveY + waveform[i] * waveAmplitude
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        const prevX = ((i - 1) / (samples - 1)) * w
        const prevY = waveY + waveform[i - 1] * waveAmplitude
        const cpX = (prevX + x) / 2
        ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2)
      }
    }
    ctx.lineTo(w, waveY + waveAmplitude)
    ctx.lineTo(0, waveY + waveAmplitude)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.restore()
  }

  private updateAndDrawParticles(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const beat = this.data.beatIntensity
    const centerX = w / 2
    const centerY = h * 0.45
    const frequencies = this.data.frequencies

    for (const p of this.particles) {
      if (beat > 0.3) {
        const angle = Math.atan2(p.y - centerY, p.x - centerX)
        const force = beat * 8
        p.vx += Math.cos(angle) * force
        p.vy += Math.sin(angle) * force
      }

      const dx = p.baseX - p.x
      const dy = p.baseY - p.y
      p.vx += dx * 0.005
      p.vy += dy * 0.005

      p.vx *= 0.96
      p.vy *= 0.96

      p.x += p.vx
      p.y += p.vy

      p.x = Math.max(10, Math.min(w - 10, p.x))
      p.y = Math.max(10, Math.min(h - 120, p.y))

      const freqValue = frequencies[p.frequencyIndex] || 0
      const brightness = 0.5 + freqValue * 0.7
      p.color = this.adjustColorBrightness(p.baseColor, brightness)

      const alpha = 0.5 + beat * 0.3 + freqValue * 0.2

      ctx.save()
      ctx.globalAlpha = Math.min(1, alpha)
      ctx.shadowColor = p.color
      ctx.shadowBlur = 12 + beat * 20 + freqValue * 10

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size + freqValue * 2, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.fill()
      ctx.restore()
    }
  }

  private interpolateColor(color1: string, color2: string, t: number): string {
    const r1 = parseInt(color1.slice(1, 3), 16)
    const g1 = parseInt(color1.slice(3, 5), 16)
    const b1 = parseInt(color1.slice(5, 7), 16)

    const r2 = parseInt(color2.slice(1, 3), 16)
    const g2 = parseInt(color2.slice(3, 5), 16)
    const b2 = parseInt(color2.slice(5, 7), 16)

    const r = Math.round(r1 + (r2 - r1) * t)
    const g = Math.round(g1 + (g2 - g1) * t)
    const b = Math.round(b1 + (b2 - b1) * t)

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  private brightenColor(hex: string, amount: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)

    const nr = Math.min(255, Math.round(r + (255 - r) * amount))
    const ng = Math.min(255, Math.round(g + (255 - g) * amount))
    const nb = Math.min(255, Math.round(b + (255 - b) * amount))

    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`
  }

  private adjustColorBrightness(hex: string, brightness: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)

    const nr = Math.min(255, Math.max(0, Math.round(r * brightness)))
    const ng = Math.min(255, Math.max(0, Math.round(g * brightness)))
    const nb = Math.min(255, Math.max(0, Math.round(b * brightness)))

    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`
  }
}
