import type { AudioDataPayload, EffectType, ColorTheme, Sensitivity, ColorThemeConfig } from '../types'
import { COLOR_THEMES, SENSITIVITY_MULTIPLIERS } from '../types'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  life: number
  maxLife: number
  angle: number
  size: number
}

type FPSCallback = (fps: number) => void
type SwitchTimeCallback = (time: number) => void

export class VisualizationPanel {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private width = 0
  private height = 0
  private dpr = 1
  private effectType: EffectType = 'bars'
  private particleSpeed = 1.0
  private sensitivity: Sensitivity = 'medium'
  private colorTheme: ColorTheme = 'neon'
  private animationId: number | null = null
  private particles: Particle[] = []
  private lastData: AudioDataPayload | null = null
  private fps = 60
  private frameCount = 0
  private fpsLastUpdate = 0
  private onFpsUpdate: FPSCallback | null = null
  private onSwitchTime: SwitchTimeCallback | null = null
  private waveformPhase = 0
  private isRunning = false

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context not available')
    this.ctx = ctx
    this.resize()
    this.initParticles()
  }

  resize(): void {
    this.dpr = window.devicePixelRatio || 1
    const rect = this.canvas.getBoundingClientRect()
    this.width = Math.max(800, rect.width)
    this.height = Math.max(500, rect.height)
    this.canvas.width = this.width * this.dpr
    this.canvas.height = this.height * this.dpr
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  private initParticles(): void {
    this.particles = []
    for (let i = 0; i < 200; i++) {
      this.particles.push(this.createParticle())
    }
  }

  private createParticle(): Particle {
    const angle = Math.random() * Math.PI * 2
    return {
      x: this.width / 2,
      y: this.height / 2,
      vx: Math.cos(angle) * (0.5 + Math.random() * 1.5),
      vy: Math.sin(angle) * (0.5 + Math.random() * 1.5),
      radius: 2 + Math.random() * 4,
      life: 0,
      maxLife: 60 + Math.random() * 120,
      angle,
      size: 1 + Math.random() * 3
    }
  }

  setEffectType(type: EffectType): void {
    const start = performance.now()
    this.effectType = type
    if (type === 'particles') {
      this.initParticles()
    }
    const elapsed = performance.now() - start
    if (this.onSwitchTime) this.onSwitchTime(elapsed)
  }

  setParticleSpeed(speed: number): void {
    this.particleSpeed = Math.max(0.1, Math.min(3, speed))
  }

  setSensitivity(s: Sensitivity): void {
    this.sensitivity = s
  }

  setColorTheme(theme: ColorTheme): void {
    this.colorTheme = theme
  }

  setOnFpsUpdate(cb: FPSCallback): void {
    this.onFpsUpdate = cb
  }

  setOnSwitchTime(cb: SwitchTimeCallback): void {
    this.onSwitchTime = cb
  }

  updateData(data: AudioDataPayload): void {
    this.lastData = data
  }

  start(): void {
    this.isRunning = true
    this.loop()
  }

  stop(): void {
    this.isRunning = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private loop = (): void => {
    if (!this.isRunning) return
    this.animationId = requestAnimationFrame(this.loop)
    const now = performance.now()
    this.frameCount++
    if (now - this.fpsLastUpdate >= 500) {
      this.fps = Math.round(this.frameCount * 1000 / (now - this.fpsLastUpdate))
      if (this.onFpsUpdate) this.onFpsUpdate(this.fps)
      this.frameCount = 0
      this.fpsLastUpdate = now
    }
    this.render()
  }

  private getTheme(): ColorThemeConfig {
    return COLOR_THEMES[this.colorTheme]
  }

  private getSensitivityMultiplier(): number {
    return SENSITIVITY_MULTIPLIERS[this.sensitivity]
  }

  private render(): void {
    const ctx = this.ctx
    const w = this.width
    const h = this.height

    ctx.fillStyle = 'rgba(10, 14, 39, 0.25)'
    ctx.fillRect(0, 0, w, h)

    if (!this.lastData) {
      this.renderIdle()
      return
    }

    switch (this.effectType) {
      case 'bars':
        this.renderBars()
        break
      case 'waveform':
        this.renderWaveform()
        break
      case 'particles':
        this.renderParticles()
        break
    }
  }

  private renderIdle(): void {
    const ctx = this.ctx
    const theme = this.getTheme()
    ctx.save()
    ctx.globalAlpha = 0.3
    const cx = this.width / 2
    const cy = this.height / 2
    ctx.beginPath()
    ctx.arc(cx, cy, 80, 0, Math.PI * 2)
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80)
    grad.addColorStop(0, theme.primary)
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.restore()
  }

  private renderBars(): void {
    if (!this.lastData) return
    const ctx = this.ctx
    const theme = this.getTheme()
    const data = this.lastData.frequencyData
    const mult = this.getSensitivityMultiplier()
    const barCount = 128
    const step = Math.floor(data.length / barCount)
    const barWidth = (this.width * 0.9) / barCount
    const gap = 2
    const startX = this.width * 0.05

    for (let i = 0; i < barCount; i++) {
      const value = data[i * step] / 255
      const amplified = Math.pow(value, 1.5) * mult
      const barHeight = amplified * this.height * 0.85
      const x = startX + i * barWidth
      const y = this.height - barHeight
      const bw = Math.max(1, barWidth - gap)

      const gradient = ctx.createLinearGradient(0, this.height, 0, y)
      gradient.addColorStop(0, theme.gradient[0])
      gradient.addColorStop(1, theme.gradient[1])

      ctx.fillStyle = gradient
      ctx.shadowColor = theme.primary
      ctx.shadowBlur = 8
      ctx.fillRect(x, y, bw, barHeight)
      ctx.shadowBlur = 0
    }
  }

  private renderWaveform(): void {
    if (!this.lastData) return
    const ctx = this.ctx
    const theme = this.getTheme()
    const data = this.lastData.timeData
    const mult = this.getSensitivityMultiplier()
    this.waveformPhase += 0.02

    ctx.lineWidth = 3
    ctx.strokeStyle = theme.primary
    ctx.shadowColor = theme.secondary
    ctx.shadowBlur = 15
    ctx.beginPath()

    const sliceWidth = this.width / data.length
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128
      const y = this.height / 2 + v * this.height * 0.4 * mult
      const x = i * sliceWidth
      const wave = Math.sin(i * 0.02 + this.waveformPhase) * 5
      if (i === 0) {
        ctx.moveTo(x, y + wave)
      } else {
        ctx.lineTo(x, y + wave)
      }
    }
    ctx.stroke()
    ctx.shadowBlur = 0

    ctx.strokeStyle = theme.accent
    ctx.globalAlpha = 0.4
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128
      const y = this.height / 2 + v * this.height * 0.4 * mult + 10
      const x = i * sliceWidth
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  private renderParticles(): void {
    if (!this.lastData) return
    const ctx = this.ctx
    const theme = this.getTheme()
    const data = this.lastData.frequencyData
    const mult = this.getSensitivityMultiplier()

    let sum = 0
    for (let i = 0; i < 64; i++) sum += data[i]
    const avg = (sum / 64) / 255
    const intensity = avg * mult

    const cx = this.width / 2
    const cy = this.height / 2

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]
      const speedMult = this.particleSpeed * (1 + intensity * 2)
      p.x += p.vx * speedMult
      p.y += p.vy * speedMult
      p.life++

      const distFromCenter = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2)
      const maxDist = Math.max(this.width, this.height) * 0.6

      if (p.life >= p.maxLife || distFromCenter > maxDist) {
        const angle = Math.random() * Math.PI * 2
        const radius = 20 + Math.random() * 30
        p.x = cx + Math.cos(angle) * radius
        p.y = cy + Math.sin(angle) * radius
        p.vx = Math.cos(angle) * (0.5 + Math.random() * 1.5)
        p.vy = Math.sin(angle) * (0.5 + Math.random() * 1.5)
        p.life = 0
        p.maxLife = 60 + Math.random() * 120
      }

      const lifeRatio = p.life / p.maxLife
      const alpha = (1 - lifeRatio) * (0.5 + intensity * 0.5)
      const size = p.size * (1 + intensity * 2)

      const colorIndex = i % 2 === 0 ? theme.particle[0] : theme.particle[1]
      ctx.beginPath()
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
      ctx.fillStyle = colorIndex
      ctx.globalAlpha = alpha
      ctx.shadowColor = colorIndex
      ctx.shadowBlur = 12
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }

    ctx.beginPath()
    ctx.arc(cx, cy, 40 + intensity * 60, 0, Math.PI * 2)
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40 + intensity * 60)
    grad.addColorStop(0, theme.primary + 'aa')
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
  }

  dispose(): void {
    this.stop()
  }
}
