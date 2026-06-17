import { IBeam } from './BeamModel'

export interface BeamRenderState {
  id: string
  x: number
  y: number
  hue: number
  brightness: number
  rotation: number
  scale: number
  opacity: number
  type: string
}

export class PreviewRenderer {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private animationFrameId: number | null = null
  private lastTime: number = 0
  private fps: number = 0
  private frameCount: number = 0
  private fpsUpdateTime: number = 0
  private cellSize: number = 80
  private gap: number = 2
  private cols: number = 5
  private rows: number = 7

  setCanvas(canvas: HTMLCanvasElement | null) {
    this.canvas = canvas
    if (canvas) {
      this.ctx = canvas.getContext('2d')
      this.resize()
    }
  }

  resize() {
    if (!this.canvas || !this.ctx) return

    const rect = this.canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = rect.width * dpr
    this.canvas.height = rect.height * dpr
    this.ctx.scale(dpr, dpr)

    const gridWidth = rect.width / this.cols
    const gridHeight = rect.height / this.rows
    this.cellSize = Math.min(gridWidth, gridHeight) - this.gap
  }

  render(beams: IBeam[], currentTime: number, isPlaying: boolean): BeamRenderState[] {
    if (!this.canvas || !this.ctx) return []

    const rect = this.canvas.getBoundingClientRect()
    const ctx = this.ctx

    ctx.clearRect(0, 0, rect.width, rect.height)

    const offsetX = (rect.width - (this.cols * (this.cellSize + this.gap))) / 2
    const offsetY = (rect.height - (this.rows * (this.cellSize + this.gap))) / 2

    const states: BeamRenderState[] = []

    for (const beam of beams) {
      const state = this.calculateBeamState(beam, currentTime, isPlaying)
      states.push(state)
      this.drawBeam(ctx, state, offsetX, offsetY)
    }

    return states
  }

  private calculateBeamState(beam: IBeam, currentTime: number, isPlaying: boolean): BeamRenderState {
    const beamStartTime = (beam.order * 0.3) % 10
    const timeSinceStart = currentTime - beamStartTime
    const isActive = timeSinceStart >= 0 && isPlaying

    let progress = 0
    if (isActive) {
      progress = Math.min(1, timeSinceStart / 1.5)
    }

    const cellCenterX = beam.gridX * (this.cellSize + this.gap) + this.cellSize / 2
    const cellCenterY = beam.gridY * (this.cellSize + this.gap) + this.cellSize / 2

    let rotation = 0
    if (beam.type === 'rotating' && isPlaying) {
      rotation = (currentTime * beam.rotationSpeed * 60) % 360
    }

    const baseScale = isActive ? 0.5 + progress * 0.5 : 0.3
    const pulseScale = isActive ? 1 + Math.sin(currentTime * 4) * 0.1 : 1

    const baseOpacity = isActive ? 0.7 + progress * 0.3 : 0.4
    const pulseOpacity = isActive ? 1 + Math.sin(currentTime * 3 + beam.order) * 0.2 : 1

    return {
      id: beam.id,
      x: cellCenterX,
      y: cellCenterY,
      hue: beam.hue,
      brightness: beam.brightness,
      rotation,
      scale: baseScale * pulseScale,
      opacity: Math.min(1, baseOpacity * pulseOpacity),
      type: beam.type,
    }
  }

  private drawBeam(
    ctx: CanvasRenderingContext2D,
    state: BeamRenderState,
    offsetX: number,
    offsetY: number
  ) {
    const x = state.x + offsetX
    const y = state.y + offsetY
    const size = this.cellSize * 0.8 * state.scale

    ctx.save()
    ctx.globalAlpha = state.opacity
    ctx.translate(x, y)

    const color = `hsl(${state.hue}, 100%, ${state.brightness}%)`
    const glowColor = `hsla(${state.hue}, 100%, ${state.brightness}%, 0.6)`

    ctx.shadowColor = glowColor
    ctx.shadowBlur = 20

    switch (state.type) {
      case 'point':
        this.drawPointLight(ctx, size, color)
        break
      case 'spot':
        this.drawSpotLight(ctx, size, color, state.rotation)
        break
      case 'rotating':
        this.drawRotatingLight(ctx, size, color, state.rotation)
        break
    }

    ctx.restore()
  }

  private drawPointLight(ctx: CanvasRenderingContext2D, size: number, color: string) {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2)
    gradient.addColorStop(0, 'white')
    gradient.addColorStop(0.3, color)
    gradient.addColorStop(1, 'transparent')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawSpotLight(ctx: CanvasRenderingContext2D, size: number, color: string, rotation: number) {
    ctx.rotate((rotation * Math.PI) / 180)

    const gradient = ctx.createLinearGradient(0, 0, 0, -size)
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, 'transparent')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.moveTo(-size * 0.15, 0)
    ctx.lineTo(-size * 0.4, -size)
    ctx.lineTo(size * 0.4, -size)
    ctx.lineTo(size * 0.15, 0)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(0, 0, size * 0.12, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawRotatingLight(ctx: CanvasRenderingContext2D, size: number, color: string, rotation: number) {
    ctx.rotate((rotation * Math.PI) / 180)

    for (let i = 0; i < 3; i++) {
      const angle = (i * 120 * Math.PI) / 180
      const beamGradient = ctx.createLinearGradient(0, 0, Math.cos(angle) * size, Math.sin(angle) * size)
      beamGradient.addColorStop(0, color)
      beamGradient.addColorStop(1, 'transparent')

      ctx.fillStyle = beamGradient
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(Math.cos(angle - 0.2) * size, Math.sin(angle - 0.2) * size)
      ctx.lineTo(Math.cos(angle + 0.2) * size, Math.sin(angle + 0.2) * size)
      ctx.closePath()
      ctx.fill()
    }

    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2)
    ctx.fill()
  }

  startAnimationLoop(
    beams: IBeam[],
    getCurrentTime: () => number,
    isPlaying: () => boolean,
    onFrame: (states: BeamRenderState[], fps: number) => void
  ) {
    this.stopAnimationLoop()

    const loop = (timestamp: number) => {
      if (!this.lastTime) this.lastTime = timestamp

      this.lastTime = timestamp

      this.frameCount++
      if (timestamp - this.fpsUpdateTime >= 1000) {
        this.fps = this.frameCount
        this.frameCount = 0
        this.fpsUpdateTime = timestamp
      }

      const states = this.render(beams, getCurrentTime(), isPlaying())
      onFrame(states, this.fps)

      this.animationFrameId = requestAnimationFrame(loop)
    }

    this.animationFrameId = requestAnimationFrame(loop)
  }

  stopAnimationLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    this.lastTime = 0
  }

  getFps(): number {
    return this.fps
  }

  destroy() {
    this.stopAnimationLoop()
    this.canvas = null
    this.ctx = null
  }
}
