import { eventBus, type LightData, type AnimationMode } from './eventBus'

const LIGHT_COUNT = 12
const TRANSITION_DURATION = 300

interface LightState {
  id: number
  currentColor: { r: number; g: number; b: number }
  targetColor: { r: number; g: number; b: number }
  currentBrightness: number
  targetBrightness: number
  colorStartTime: number
  brightnessStartTime: number
}

class LightController {
  private lights: LightState[] = []
  private selectedLightId: number | null = null
  private animationMode: AnimationMode = 'static'
  private animationFrame: number | null = null
  private startTime: number = 0
  private baseBrightness: number = 80
  private baseColor: { r: number; g: number; b: number } = { r: 0, g: 150, b: 255 }

  constructor() {
    this.initLights()
    this.startAnimationLoop()
  }

  private initLights(): void {
    for (let i = 0; i < LIGHT_COUNT; i++) {
      this.lights.push({
        id: i,
        currentColor: { ...this.baseColor },
        targetColor: { ...this.baseColor },
        currentBrightness: this.baseBrightness,
        targetBrightness: this.baseBrightness,
        colorStartTime: 0,
        brightnessStartTime: 0,
      })
    }
  }

  private startAnimationLoop(): void {
    const loop = () => {
      const now = performance.now()
      this.updateTransitions(now)
      this.updateAnimations(now)
      this.emitLightData()
      this.animationFrame = requestAnimationFrame(loop)
    }
    this.animationFrame = requestAnimationFrame(loop)
  }

  private updateTransitions(now: number): void {
    this.lights.forEach(light => {
      const colorProgress = Math.min(1, (now - light.colorStartTime) / TRANSITION_DURATION)
      const easeColor = this.easeInOutCubic(colorProgress)
      light.currentColor.r = light.currentColor.r + (light.targetColor.r - light.currentColor.r) * easeColor
      light.currentColor.g = light.currentColor.g + (light.targetColor.g - light.currentColor.g) * easeColor
      light.currentColor.b = light.currentColor.b + (light.targetColor.b - light.currentColor.b) * easeColor

      const brightnessProgress = Math.min(1, (now - light.brightnessStartTime) / TRANSITION_DURATION)
      const easeBrightness = this.easeInOutCubic(brightnessProgress)
      light.currentBrightness = light.currentBrightness + (light.targetBrightness - light.currentBrightness) * easeBrightness
    })
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  private updateAnimations(now: number): void {
    if (this.animationMode === 'static') {
      this.startTime = now
      return
    }

    const elapsed = now - this.startTime

    switch (this.animationMode) {
      case 'breathing':
        this.updateBreathing(elapsed)
        break
      case 'alternating':
        this.updateAlternating(elapsed)
        break
      case 'flowing':
        this.updateFlowing(elapsed)
        break
    }
  }

  private updateBreathing(elapsed: number): void {
    const period = 2000
    const phase = (elapsed % period) / period
    const brightnessFactor = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2))

    this.lights.forEach(light => {
      light.currentBrightness = this.baseBrightness * brightnessFactor
      light.targetBrightness = light.currentBrightness
    })
  }

  private updateAlternating(elapsed: number): void {
    const period = 1000
    const phase = Math.floor((elapsed % period) / (period / 2))

    this.lights.forEach((light, index) => {
      const isOn = (index % 2 === 0) === (phase === 0)
      light.currentBrightness = isOn ? this.baseBrightness : this.baseBrightness * 0.1
      light.targetBrightness = light.currentBrightness
    })
  }

  private updateFlowing(elapsed: number): void {
    const period = 3000
    const tailLength = 4

    this.lights.forEach((light, index) => {
      const position = (elapsed % period) / period * LIGHT_COUNT
      const distance = Math.abs(index - position)
      const wrappedDistance = Math.min(distance, LIGHT_COUNT - distance)
      
      if (wrappedDistance < tailLength) {
        const intensity = 1 - wrappedDistance / tailLength
        light.currentBrightness = this.baseBrightness * (0.1 + 0.9 * intensity)
      } else {
        light.currentBrightness = this.baseBrightness * 0.1
      }
      light.targetBrightness = light.currentBrightness
    })
  }

  private emitLightData(): void {
    const data: LightData[] = this.lights.map(light => ({
      id: light.id,
      color: `rgb(${Math.round(light.currentColor.r)}, ${Math.round(light.currentColor.g)}, ${Math.round(light.currentColor.b)})`,
      brightness: light.currentBrightness,
    }))
    eventBus.emit('lightUpdate', data)
  }

  setSelectedLight(id: number | null): void {
    this.selectedLightId = id
  }

  setBrightness(value: number): void {
    if (this.animationMode !== 'static') {
      this.baseBrightness = value
      return
    }

    const now = performance.now()
    if (this.selectedLightId === null) {
      this.baseBrightness = value
      this.lights.forEach(light => {
        light.targetBrightness = value
        light.brightnessStartTime = now
      })
    } else {
      const light = this.lights[this.selectedLightId]
      if (light) {
        light.targetBrightness = value
        light.brightnessStartTime = now
      }
    }
  }

  setColor(color: string): void {
    const rgb = this.parseColor(color)
    if (!rgb) return

    const now = performance.now()
    if (this.selectedLightId === null) {
      this.baseColor = rgb
      this.lights.forEach(light => {
        light.targetColor = { ...rgb }
        light.colorStartTime = now
      })
    } else {
      const light = this.lights[this.selectedLightId]
      if (light) {
        light.targetColor = { ...rgb }
        light.colorStartTime = now
      }
    }
  }

  setAnimationMode(mode: AnimationMode): void {
    this.animationMode = mode
    this.startTime = performance.now()
    
    if (mode === 'static') {
      const now = performance.now()
      this.lights.forEach(light => {
        light.targetBrightness = this.baseBrightness
        light.brightnessStartTime = now
        light.targetColor = { ...this.baseColor }
        light.colorStartTime = now
      })
    }
  }

  selectAll(): void {
    this.selectedLightId = null
  }

  private parseColor(color: string): { r: number; g: number; b: number } | null {
    if (color.startsWith('#')) {
      const hex = color.slice(1)
      if (hex.length === 6) {
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
        }
      }
    }
    
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
      }
    }
    
    return null
  }

  getSelectedBrightness(): number {
    if (this.selectedLightId === null) {
      return this.baseBrightness
    }
    const light = this.lights[this.selectedLightId]
    return light ? light.targetBrightness : this.baseBrightness
  }

  getSelectedColor(): string {
    const color = this.selectedLightId === null 
      ? this.baseColor 
      : this.lights[this.selectedLightId]?.targetColor || this.baseColor
    return `rgb(${color.r}, ${color.g}, ${color.b})`
  }

  destroy(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame)
    }
  }
}

export const lightController = new LightController()
