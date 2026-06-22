import type { VisualizerState } from './store'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
  maxLife: number
}

export class Visualizer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number
  private particles: Particle[] = []
  private scrollOffset: number = 0
  private waveformHistory: number[][] = []
  private readonly maxHistoryLength: number = 500
  private lastFrameTime: number = 0
  private fps: number = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.width = 1024
    this.height = 512
    this.canvas.width = this.width
    this.canvas.height = this.height
  }

  resize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.canvas.width = width
    this.canvas.height = height
  }

  render(
    waveformData: Uint8Array,
    frequencyData: Uint8Array,
    state: VisualizerState,
    currentTime: number,
    duration: number
  ): void {
    const now = performance.now()
    if (this.lastFrameTime) {
      const delta = now - this.lastFrameTime
      this.fps = 1000 / delta
    }
    this.lastFrameTime = now

    this.ctx.globalAlpha = state.transitionOpacity
    this.ctx.fillStyle = state.backgroundColor
    this.ctx.fillRect(0, 0, this.width, this.height)

    const progress = duration > 0 ? currentTime / duration : 0

    switch (state.mode) {
      case 'waveform':
        this.drawWaveform(waveformData, state, progress)
        break
      case 'spectrum':
        this.drawSpectrum(frequencyData, state)
        break
      case 'circular':
        this.drawCircularSpectrum(frequencyData, waveformData, state)
        break
      case 'particle':
        this.drawParticles(frequencyData, waveformData, state)
        break
    }

    this.ctx.globalAlpha = 1
  }

  private drawWaveform(
    data: Uint8Array,
    state: VisualizerState,
    progress: number
  ): void {
    const { primaryColor, waveformLineWidth } = state

    const currentWaveform: number[] = []
    for (let i = 0; i < data.length; i++) {
      currentWaveform.push(data[i])
    }

    this.waveformHistory.push(currentWaveform)
    if (this.waveformHistory.length > this.maxHistoryLength) {
      this.waveformHistory.shift()
    }

    const scrollSpeed = progress * 2
    this.scrollOffset += scrollSpeed * 2

    this.ctx.lineWidth = waveformLineWidth
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'

    for (let h = 0; h < this.waveformHistory.length; h++) {
      const wave = this.waveformHistory[h]
      const x = (h / this.maxHistoryLength) * this.width - (this.scrollOffset % (this.width / this.maxHistoryLength))
      const alpha = (h / this.waveformHistory.length) * 0.6 + 0.2

      this.ctx.beginPath()
      this.ctx.strokeStyle = this.hexToRgba(primaryColor, alpha)

      for (let i = 0; i < wave.length; i++) {
        const v = wave[i] / 128.0 - 1
        const y = (this.height / 2) + v * (this.height / 2 - 20)

        if (i === 0) {
          this.ctx.moveTo(x, y)
        } else {
          const prevX = ((i - 1) / wave.length) * (this.width / this.maxHistoryLength) + x
          const currX = (i / wave.length) * (this.width / this.maxHistoryLength) + x
          this.ctx.lineTo(currX, y)
          this.ctx.moveTo(prevX, y)
        }
      }

      this.ctx.stroke()
    }

    this.ctx.beginPath()
    this.ctx.strokeStyle = primaryColor
    this.ctx.lineWidth = waveformLineWidth + 1
    this.ctx.shadowColor = primaryColor
    this.ctx.shadowBlur = 15

    const sliceWidth = this.width / data.length
    let x = 0

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0
      const y = (v * this.height) / 2

      if (i === 0) {
        this.ctx.moveTo(x, y)
      } else {
        this.ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    this.ctx.lineTo(this.width, this.height / 2)
    this.ctx.stroke()
    this.ctx.shadowBlur = 0
  }

  private drawSpectrum(data: Uint8Array, state: VisualizerState): void {
    const { primaryColor, spectrumBarWidth, spectrumColorMode, fftSize } = state

    const barCount = Math.floor(data.length * (spectrumBarWidth / 4))
    const gap = 2
    const totalBarWidth = spectrumBarWidth + gap
    const startX = (this.width - barCount * totalBarWidth) / 2

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * (fftSize / 2))
      const value = data[dataIndex] || 0
      const barHeight = (value / 255) * (this.height - 40)
      const x = startX + i * totalBarWidth
      const y = this.height - barHeight - 20

      let color: string
      if (spectrumColorMode === 'rainbow') {
        const hue = (i / barCount) * 360
        color = `hsl(${hue}, 80%, 60%)`
      } else {
        color = primaryColor
      }

      const gradient = this.ctx.createLinearGradient(x, y, x, this.height - 20)
      gradient.addColorStop(0, color)
      gradient.addColorStop(1, this.hexToRgba(color, 0.3))

      this.ctx.fillStyle = gradient
      this.ctx.shadowColor = color
      this.ctx.shadowBlur = 10
      this.ctx.beginPath()
      this.ctx.roundRect(x, y, spectrumBarWidth, barHeight, [spectrumBarWidth / 2, spectrumBarWidth / 2, 0, 0])
      this.ctx.fill()
    }

    this.ctx.shadowBlur = 0
  }

  private drawCircularSpectrum(
    frequencyData: Uint8Array,
    waveformData: Uint8Array,
    state: VisualizerState
  ): void {
    const { primaryColor, circularRadius, fftSize } = state

    const centerX = this.width / 2
    const centerY = this.height / 2
    const barCount = 180
    const maxBarLength = this.height / 2 - circularRadius - 20

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * (fftSize / 2))
      const value = frequencyData[dataIndex] || 0
      const barLength = (value / 255) * maxBarLength

      const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2
      const hue = (i / barCount) * 360
      const color = `hsl(${hue}, 80%, 60%)`

      const innerX = centerX + Math.cos(angle) * circularRadius
      const innerY = centerY + Math.sin(angle) * circularRadius
      const outerX = centerX + Math.cos(angle) * (circularRadius + barLength)
      const outerY = centerY + Math.sin(angle) * (circularRadius + barLength)

      this.ctx.beginPath()
      this.ctx.strokeStyle = color
      this.ctx.lineWidth = 3
      this.ctx.lineCap = 'round'
      this.ctx.shadowColor = color
      this.ctx.shadowBlur = 8
      this.ctx.moveTo(innerX, innerY)
      this.ctx.lineTo(outerX, outerY)
      this.ctx.stroke()
    }

    this.ctx.shadowBlur = 0

    this.ctx.beginPath()
    this.ctx.strokeStyle = primaryColor
    this.ctx.lineWidth = 2
    const innerRadius = circularRadius - 10

    for (let i = 0; i < waveformData.length; i++) {
      const v = waveformData[i] / 128.0 - 1
      const angle = (i / waveformData.length) * Math.PI * 2 - Math.PI / 2
      const radius = innerRadius + v * 15
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      if (i === 0) {
        this.ctx.moveTo(x, y)
      } else {
        this.ctx.lineTo(x, y)
      }
    }

    this.ctx.closePath()
    this.ctx.stroke()

    const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, innerRadius)
    gradient.addColorStop(0, this.hexToRgba(primaryColor, 0.3))
    gradient.addColorStop(1, this.hexToRgba(primaryColor, 0.05))
    this.ctx.fillStyle = gradient
    this.ctx.fill()
  }

  private drawParticles(
    frequencyData: Uint8Array,
    waveformData: Uint8Array,
    state: VisualizerState
  ): void {
    const { primaryColor, particleCount } = state

    const avgFrequency = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length
    const bassFreq = frequencyData.slice(0, 10).reduce((a, b) => a + b, 0) / 10
    const midFreq = frequencyData.slice(10, 100).reduce((a, b) => a + b, 0) / 90
    const highFreq = frequencyData.slice(100).reduce((a, b) => a + b, 0) / (frequencyData.length - 100)

    const bassBoost = bassFreq / 255
    const midBoost = midFreq / 255
    const highBoost = highFreq / 255

    while (this.particles.length < particleCount) {
      this.particles.push(this.createParticle(bassBoost, midBoost, highBoost))
    }

    while (this.particles.length > particleCount) {
      this.particles.pop()
    }

    const centerX = this.width / 2
    const centerY = this.height / 2

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]

      const waveIndex = Math.floor((i / this.particles.length) * waveformData.length)
      const waveValue = waveformData[waveIndex] / 128.0 - 1

      p.vx += waveValue * 0.1 * highBoost
      p.vy += waveValue * 0.1 * highBoost

      const dx = centerX - p.x
      const dy = centerY - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 0) {
        p.vx += (dx / dist) * 0.02 * bassBoost
        p.vy += (dy / dist) * 0.02 * bassBoost
      }

      p.vx *= 0.98
      p.vy *= 0.98

      p.x += p.vx
      p.y += p.vy

      p.life--

      const size = p.size * (1 + midBoost * 0.5)
      const alpha = (p.life / p.maxLife) * 0.8

      const hue = (i / this.particles.length) * 360
      const color = `hsla(${hue}, 80%, 60%, ${alpha})`

      this.ctx.beginPath()
      this.ctx.fillStyle = color
      this.ctx.shadowColor = color
      this.ctx.shadowBlur = 15 * (1 + bassBoost)
      this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
      this.ctx.fill()

      if (p.life <= 0 || p.x < -50 || p.x > this.width + 50 || p.y < -50 || p.y > this.height + 50) {
        Object.assign(p, this.createParticle(bassBoost, midBoost, highBoost))
      }
    }

    this.ctx.shadowBlur = 0

    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i]
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j]
        const dx = p1.x - p2.x
        const dy = p1.y - p2.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 80 && avgFrequency > 50) {
          const alpha = (1 - dist / 80) * 0.3 * (avgFrequency / 255)
          this.ctx.beginPath()
          this.ctx.strokeStyle = this.hexToRgba(primaryColor, alpha)
          this.ctx.lineWidth = 1
          this.ctx.moveTo(p1.x, p1.y)
          this.ctx.lineTo(p2.x, p2.y)
          this.ctx.stroke()
        }
      }
    }
  }

  private createParticle(bassBoost: number, midBoost: number, highBoost: number): Particle {
    const angle = Math.random() * Math.PI * 2
    const speed = 1 + Math.random() * 3 * (1 + highBoost)
    const startDist = 50 + Math.random() * 200 * (1 + bassBoost)

    return {
      x: this.width / 2 + Math.cos(angle) * startDist,
      y: this.height / 2 + Math.sin(angle) * startDist,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 4 * (1 + midBoost),
      life: 120 + Math.random() * 120,
      maxLife: 240
    }
  }

  private hexToRgba(hex: string, alpha: number): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return `rgba(99, 102, 241, ${alpha})`
    const r = parseInt(result[1], 16)
    const g = parseInt(result[2], 16)
    const b = parseInt(result[3], 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  getFPS(): number {
    return this.fps
  }

  clear(): void {
    this.waveformHistory = []
    this.particles = []
    this.scrollOffset = 0
  }
}
