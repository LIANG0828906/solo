export type VisualState = 'idle' | 'pulse' | 'flash'

export interface PulseConfig {
  minRadius: number
  maxRadius: number
  duration: number
  colorFrom: string
  colorTo: string
}

export interface FlashConfig {
  color: string
  opacityFrom: number
  opacityTo: number
  duration: number
}

const DEFAULT_PULSE: PulseConfig = {
  minRadius: 30,
  maxRadius: 60,
  duration: 1.0,
  colorFrom: '#E94560',
  colorTo: '#533483'
}

const DEFAULT_FLASH: FlashConfig = {
  color: '#FFFFFF',
  opacityFrom: 0.2,
  opacityTo: 0,
  duration: 0.1
}

export class VisualRenderer {
  private pulseConfig: PulseConfig
  private flashConfig: FlashConfig
  private pulseStartTime: number = 0
  private flashStartTime: number = 0
  private state: VisualState = 'idle'
  private rafId: number = 0
  private onUpdate: ((data: VisualUpdateData) => void) | null = null
  private running: boolean = false

  constructor() {
    this.pulseConfig = { ...DEFAULT_PULSE }
    this.flashConfig = { ...DEFAULT_FLASH }
  }

  setPulseConfig(config: Partial<PulseConfig>): void {
    this.pulseConfig = { ...this.pulseConfig, ...config }
  }

  setFlashConfig(config: Partial<FlashConfig>): void {
    this.flashConfig = { ...this.flashConfig, ...config }
  }

  onUpdateEvent(cb: (data: VisualUpdateData) => void): void {
    this.onUpdate = cb
  }

  triggerPulse(timestamp?: number): void {
    this.pulseStartTime = timestamp ?? performance.now()
    this.state = 'pulse'
    this.triggerFlash(this.pulseStartTime)
  }

  triggerFlash(timestamp?: number): void {
    this.flashStartTime = timestamp ?? performance.now()
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.loop(performance.now())
  }

  stop(): void {
    this.running = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
  }

  private loop = (now: number): void => {
    if (!this.running) return

    const data = this.computeVisualData(now)
    this.onUpdate?.(data)

    this.rafId = requestAnimationFrame(this.loop)
  }

  computeVisualData(now: number): VisualUpdateData {
    const pulseElapsed = (now - this.pulseStartTime) / 1000
    const pulseDuration = this.pulseConfig.duration
    const pulseProgress = Math.min(pulseElapsed / pulseDuration, 1)
    const eased = this.easeOutCubic(pulseProgress)

    const currentRadius =
      this.pulseConfig.minRadius +
      (this.pulseConfig.maxRadius - this.pulseConfig.minRadius) * eased

    const currentColor = this.interpolateColor(
      this.pulseConfig.colorFrom,
      this.pulseConfig.colorTo,
      eased
    )

    const flashElapsed = (now - this.flashStartTime) / 1000
    const flashProgress = Math.min(flashElapsed / this.flashConfig.duration, 1)
    const flashOpacity =
      this.flashConfig.opacityFrom +
      (this.flashConfig.opacityTo - this.flashConfig.opacityFrom) * flashProgress

    return {
      radius: currentRadius,
      color: currentColor,
      flashOpacity: Math.max(flashOpacity, 0),
      pulseProgress,
      isPulsing: pulseProgress < 1
    }
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
  }

  private interpolateColor(from: string, to: string, progress: number): string {
    const fR = parseInt(from.slice(1, 3), 16)
    const fG = parseInt(from.slice(3, 5), 16)
    const fB = parseInt(from.slice(5, 7), 16)
    const tR = parseInt(to.slice(1, 3), 16)
    const tG = parseInt(to.slice(3, 5), 16)
    const tB = parseInt(to.slice(5, 7), 16)

    const r = Math.round(fR + (tR - fR) * progress)
    const g = Math.round(fG + (tG - fG) * progress)
    const b = Math.round(fB + (tB - fB) * progress)

    return `rgb(${r},${g},${b})`
  }
}

export interface VisualUpdateData {
  radius: number
  color: string
  flashOpacity: number
  pulseProgress: number
  isPulsing: boolean
}
