import * as THREE from 'three'
import { v4 as uuidv4 } from 'uuid'
import {
  AudioAnalysisResult,
  ControlParams,
  ParticleData,
  PRESET_CONFIGS,
  VisualizationMode,
  VisualizerPreset,
} from '@/types'
import { getColorFromFrequency } from '@/utils/colors'
import { clamp, lerp, ValueAnimator, Vector3Animator, easeInOutQuart } from '@/utils/animation'

export class ParticleSystem {
  private particles: ParticleData[] = []
  private geometry: THREE.BufferGeometry | null = null
  private material: THREE.PointsMaterial | null = null
  private points: THREE.Points | null = null
  private maxParticles: number = 8000
  private currentCount: number = 5000
  private positions: Float32Array | null = null
  private colors: Float32Array | null = null
  private sizes: Float32Array | null = null
  private targetPreset: VisualizerPreset = 'nebula'
  private currentPreset: VisualizerPreset = 'nebula'
  private presetAnimator: ValueAnimator
  private targetVisualizationMode: VisualizationMode = '3d'
  private currentVisualizationMode: VisualizationMode = '3d'
  private modeAnimator: ValueAnimator
  private time: number = 0
  private beatPulse: number = 0
  private tempVector: THREE.Vector3 = new THREE.Vector3()
  private tempColor: { r: number; g: number; b: number } = { r: 0, g: 0, b: 0 }
  private positionAnimators: Map<string, Vector3Animator> = new Map()

  constructor() {
    this.presetAnimator = new ValueAnimator(1, 2000, easeInOutQuart)
    this.modeAnimator = new ValueAnimator(1, 1500, easeInOutQuart)
  }

  init(count: number): void {
    this.currentCount = clamp(count, 1000, this.maxParticles)
    this.createParticles(this.currentCount)
    this.createGeometry()
    this.createMaterial()
    this.points = new THREE.Points(this.geometry!, this.material!)
    this.points.frustumCulled = false
  }

  private createParticles(count: number): void {
    this.particles = []
    this.positionAnimators.clear()

    for (let i = 0; i < count; i++) {
      const particle = this.createSingleParticle(i, count)
      this.particles.push(particle)
    }
  }

  private createSingleParticle(_index: number, _total: number): ParticleData {
    const id = uuidv4()
    const frequencyIndex = Math.floor(Math.random() * 256)
    const preset = PRESET_CONFIGS[this.currentPreset]
    const radius = preset.distribution.radius * (0.3 + Math.random() * 0.7)

    let x: number, y: number, z: number

    switch (preset.distribution.type) {
      case 'cube':
        x = (Math.random() - 0.5) * radius * 2
        y = (Math.random() - 0.5) * radius * 2
        z = (Math.random() - 0.5) * radius * 2
        break
      case 'disc':
        const angle = Math.random() * Math.PI * 2
        const discRadius = Math.sqrt(Math.random()) * radius
        x = Math.cos(angle) * discRadius
        y = (Math.random() - 0.5) * radius * 0.3
        z = Math.sin(angle) * discRadius
        break
      case 'sphere':
      default:
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        x = radius * Math.sin(phi) * Math.cos(theta)
        y = radius * Math.sin(phi) * Math.sin(theta)
        z = radius * Math.cos(phi)
        break
    }

    const baseSize = 1 + Math.random() * 5

    return {
      id,
      position: { x, y, z },
      basePosition: { x, y, z },
      velocity: {
        x: (Math.random() - 0.5) * 0.01,
        y: (Math.random() - 0.5) * 0.01,
        z: (Math.random() - 0.5) * 0.01,
      },
      color: { r: 1, g: 1, b: 1 },
      size: baseSize,
      baseSize,
      frequencyIndex,
      angle: Math.random() * Math.PI * 2,
      radius,
      phase: Math.random() * Math.PI * 2,
    }
  }

  private createGeometry(): void {
    this.geometry = new THREE.BufferGeometry()

    const vertexCount = this.maxParticles
    this.positions = new Float32Array(vertexCount * 3)
    this.colors = new Float32Array(vertexCount * 3)
    this.sizes = new Float32Array(vertexCount)

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1))

    this.updateGeometryBuffers()
  }

  private createMaterial(): void {
    this.material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
  }

  private updateGeometryBuffers(): void {
    if (!this.positions || !this.colors || !this.sizes) return

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i]
      const i3 = i * 3

      this.positions[i3] = particle.position.x
      this.positions[i3 + 1] = particle.position.y
      this.positions[i3 + 2] = particle.position.z

      this.colors[i3] = particle.color.r
      this.colors[i3 + 1] = particle.color.g
      this.colors[i3 + 2] = particle.color.b

      this.sizes[i] = particle.size
    }

    if (this.geometry) {
      this.geometry.attributes.position.needsUpdate = true
      this.geometry.attributes.color.needsUpdate = true
      this.geometry.attributes.size.needsUpdate = true
      this.geometry.setDrawRange(0, this.currentCount)
    }
  }

  update(
    frequencyData: Uint8Array,
    waveformData: Uint8Array,
    audioData: AudioAnalysisResult,
    deltaTime: number,
    controlParams: ControlParams
  ): void {
    this.time += deltaTime * controlParams.speed

    if (audioData.isBeat) {
      this.beatPulse = 1
    } else {
      this.beatPulse = lerp(this.beatPulse, 0, deltaTime * 5)
    }

    const presetTransition = this.presetAnimator.update(deltaTime)
    const modeTransition = this.modeAnimator.update(deltaTime)

    if (presetTransition >= 1 && this.currentPreset !== this.targetPreset) {
      this.currentPreset = this.targetPreset
    }

    if (modeTransition >= 1 && this.currentVisualizationMode !== this.targetVisualizationMode) {
      this.currentVisualizationMode = this.targetVisualizationMode
    }

    const currentConfig = PRESET_CONFIGS[this.currentPreset]
    const targetConfig = PRESET_CONFIGS[this.targetPreset]

    for (let i = 0; i < this.currentCount; i++) {
      const particle = this.particles[i]
      if (!particle) continue

      this.updateParticleMotion(
        particle,
        i,
        this.currentCount,
        frequencyData,
        waveformData,
        audioData,
        deltaTime,
        controlParams,
        currentConfig,
        targetConfig,
        presetTransition
      )

      this.updateParticleColor(
        particle,
        i,
        frequencyData,
        controlParams,
        presetTransition
      )

      this.updateParticleSize(particle, frequencyData, audioData, controlParams)

      this.applyVisualizationMode(particle, modeTransition, i, this.currentCount, frequencyData)
    }

    this.updateGeometryBuffers()

    if (this.material) {
      this.material.opacity = controlParams.opacity
    }
  }

  private updateParticleMotion(
    particle: ParticleData,
    _index: number,
    _total: number,
    frequencyData: Uint8Array,
    _waveformData: Uint8Array,
    audioData: AudioAnalysisResult,
    deltaTime: number,
    controlParams: ControlParams,
    currentConfig: typeof PRESET_CONFIGS[VisualizerPreset],
    targetConfig: typeof PRESET_CONFIGS[VisualizerPreset],
    transition: number
  ): void {
    const freqValue = frequencyData[particle.frequencyIndex] / 255
    const speed = controlParams.speed * deltaTime * 60

    const currentAmplitude = currentConfig.motion.amplitude
    const targetAmplitude = targetConfig.motion.amplitude
    const amplitude = lerp(currentAmplitude, targetAmplitude, transition)

    const currentSpeedMult = currentConfig.motion.speedMultiplier
    const targetSpeedMult = targetConfig.motion.speedMultiplier
    const speedMult = lerp(currentSpeedMult, targetSpeedMult, transition)

    const currentMotion = currentConfig.motion.type
    const targetMotion = targetConfig.motion.type

    const basePos = particle.basePosition
    const pos = particle.position

    const beatOffset = this.beatPulse * amplitude * 0.3

    if (transition < 1 && currentMotion !== targetMotion) {
      const currentDisp = this.calculateMotionDisplacement(
        currentMotion,
        particle,
        freqValue,
        audioData,
        amplitude,
        speedMult,
        speed
      )
      const targetDisp = this.calculateMotionDisplacement(
        targetMotion,
        particle,
        freqValue,
        audioData,
        amplitude,
        speedMult,
        speed
      )

      pos.x = basePos.x + lerp(currentDisp.x, targetDisp.x, transition) + beatOffset * (basePos.x / particle.radius)
      pos.y = basePos.y + lerp(currentDisp.y, targetDisp.y, transition) + beatOffset * (basePos.y / particle.radius)
      pos.z = basePos.z + lerp(currentDisp.z, targetDisp.z, transition) + beatOffset * (basePos.z / particle.radius)
    } else {
      const disp = this.calculateMotionDisplacement(
        this.currentPreset === this.targetPreset ? currentMotion : targetMotion,
        particle,
        freqValue,
        audioData,
        amplitude,
        speedMult,
        speed
      )

      pos.x = basePos.x + disp.x + beatOffset * (basePos.x / particle.radius)
      pos.y = basePos.y + disp.y + beatOffset * (basePos.y / particle.radius)
      pos.z = basePos.z + disp.z + beatOffset * (basePos.z / particle.radius)
    }

    pos.x += particle.velocity.x * speed
    pos.y += particle.velocity.y * speed
    pos.z += particle.velocity.z * speed

    particle.angle += 0.01 * speedMult * speed
  }

  private calculateMotionDisplacement(
    motionType: 'flow' | 'expand' | 'rotate',
    particle: ParticleData,
    freqValue: number,
    audioData: AudioAnalysisResult,
    amplitude: number,
    speedMult: number,
    speed: number
  ): { x: number; y: number; z: number } {
    const time = this.time * speedMult

    switch (motionType) {
      case 'flow':
        return {
          x: Math.sin(time * 0.5 + particle.phase) * amplitude * freqValue,
          y: Math.cos(time * 0.3 + particle.phase * 1.3) * amplitude * freqValue * 0.8,
          z: Math.sin(time * 0.7 + particle.phase * 0.7) * amplitude * freqValue * 0.6,
        }

      case 'expand':
        const expandAmount = (audioData.lowFrequency * 0.7 + audioData.averageVolume * 0.3) * amplitude
        const nx = particle.basePosition.x / particle.radius
        const ny = particle.basePosition.y / particle.radius
        const nz = particle.basePosition.z / particle.radius
        return {
          x: nx * expandAmount,
          y: ny * expandAmount,
          z: nz * expandAmount,
        }

      case 'rotate':
        const rotationSpeed = 0.5 + audioData.highFrequency * 2
        const radius = particle.radius + freqValue * amplitude * 0.5
        const angle = particle.angle + time * rotationSpeed * speed * 0.1
        const heightOffset = Math.sin(time * 2 + particle.phase) * amplitude * 0.3 * freqValue
        return {
          x: Math.cos(angle) * radius - particle.basePosition.x,
          y: heightOffset,
          z: Math.sin(angle) * radius - particle.basePosition.z,
        }

      default:
        return { x: 0, y: 0, z: 0 }
    }
  }

  private updateParticleColor(
    particle: ParticleData,
    index: number,
    frequencyData: Uint8Array,
    controlParams: ControlParams,
    transition: number
  ): void {
    const freqValue = frequencyData[particle.frequencyIndex]

    const currentColor = getColorFromFrequency(
      freqValue,
      particle.frequencyIndex,
      256,
      this.currentPreset,
      controlParams.colorSensitivity
    )

    const targetColor = getColorFromFrequency(
      freqValue,
      particle.frequencyIndex,
      256,
      this.targetPreset,
      controlParams.colorSensitivity
    )

    this.tempColor.r = lerp(currentColor.r, targetColor.r, transition)
    this.tempColor.g = lerp(currentColor.g, targetColor.g, transition)
    this.tempColor.b = lerp(currentColor.b, targetColor.b, transition)

    const intensity = 0.6 + (freqValue / 255) * 0.4 * controlParams.colorSensitivity
    particle.color.r = clamp(this.tempColor.r * intensity, 0, 1)
    particle.color.g = clamp(this.tempColor.g * intensity, 0, 1)
    particle.color.b = clamp(this.tempColor.b * intensity, 0, 1)

    if (this.beatPulse > 0.1 && index % 3 === 0) {
      particle.color.r = Math.min(1, particle.color.r + this.beatPulse * 0.3)
      particle.color.g = Math.min(1, particle.color.g + this.beatPulse * 0.2)
      particle.color.b = Math.min(1, particle.color.b + this.beatPulse * 0.3)
    }
  }

  private updateParticleSize(
    particle: ParticleData,
    frequencyData: Uint8Array,
    audioData: AudioAnalysisResult,
    controlParams: ControlParams
  ): void {
    const freqValue = frequencyData[particle.frequencyIndex] / 255
    const beatBoost = this.beatPulse * 2
    const volumeBoost = audioData.averageVolume * 1.5

    particle.size = particle.baseSize * (1 + freqValue * 2 * controlParams.colorSensitivity + beatBoost + volumeBoost * 0.5)
  }

  private applyVisualizationMode(
    particle: ParticleData,
    transition: number,
    index: number,
    total: number,
    frequencyData: Uint8Array
  ): void {
    if (this.currentVisualizationMode === this.targetVisualizationMode && transition >= 1) {
      return
    }

    const freqValue = frequencyData[particle.frequencyIndex] / 255

    const getModePosition = (mode: VisualizationMode) => {
      switch (mode) {
        case '2d':
          const angle = (index / total) * Math.PI * 4 + particle.phase
          const radius = 2 + freqValue * 6
          return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            z: 0,
          }
        case 'spectrum':
          const barIndex = Math.floor((index / total) * 64)
          const barX = (barIndex - 32) * 0.25
          const barZ = freqValue * 5
          return {
            x: barX + (Math.random() - 0.5) * 0.1,
            y: particle.basePosition.y * 0.3,
            z: barZ,
          }
        case '3d':
        default:
          return {
            x: particle.position.x,
            y: particle.position.y,
            z: particle.position.z,
          }
      }
    }

    const currentPos = getModePosition(this.currentVisualizationMode)
    const targetPos = getModePosition(this.targetVisualizationMode)

    particle.position.x = lerp(currentPos.x, targetPos.x, transition)
    particle.position.y = lerp(currentPos.y, targetPos.y, transition)
    particle.position.z = lerp(currentPos.z, targetPos.z, transition)
  }

  setPreset(preset: VisualizerPreset): void {
    if (preset === this.targetPreset) return
    this.targetPreset = preset
    this.presetAnimator.animateTo(1)
    this.presetAnimator = new ValueAnimator(0, 2000, easeInOutQuart)
    this.presetAnimator.animateTo(1)

    this.particles.forEach((particle, i) => {
      const targetPresetConfig = PRESET_CONFIGS[preset]
      const radius = targetPresetConfig.distribution.radius * (0.3 + (i / this.currentCount) * 0.7)

      let tx: number, ty: number, tz: number
      switch (targetPresetConfig.distribution.type) {
        case 'cube':
          tx = (Math.random() - 0.5) * radius * 2
          ty = (Math.random() - 0.5) * radius * 2
          tz = (Math.random() - 0.5) * radius * 2
          break
        case 'disc':
          const angle = Math.random() * Math.PI * 2
          const discRadius = Math.sqrt(Math.random()) * radius
          tx = Math.cos(angle) * discRadius
          ty = (Math.random() - 0.5) * radius * 0.3
          tz = Math.sin(angle) * discRadius
          break
        case 'sphere':
        default:
          const theta = Math.random() * Math.PI * 2
          const phi = Math.acos(2 * Math.random() - 1)
          tx = radius * Math.sin(phi) * Math.cos(theta)
          ty = radius * Math.sin(phi) * Math.sin(theta)
          tz = radius * Math.cos(phi)
          break
      }

      particle.basePosition.x = tx
      particle.basePosition.y = ty
      particle.basePosition.z = tz
      particle.radius = radius
    })
  }

  setParticleCount(count: number): void {
    const newCount = clamp(count, 1000, this.maxParticles)
    if (newCount === this.currentCount) return

    if (newCount > this.currentCount) {
      for (let i = this.currentCount; i < newCount; i++) {
        const particle = this.createSingleParticle(i, newCount)
        this.particles.push(particle)
      }
    } else {
      this.particles = this.particles.slice(0, newCount)
    }

    this.currentCount = newCount
    this.updateGeometryBuffers()
  }

  setVisualizationMode(mode: VisualizationMode): void {
    if (mode === this.targetVisualizationMode) return
    this.targetVisualizationMode = mode
    this.modeAnimator = new ValueAnimator(0, 1500, easeInOutQuart)
    this.modeAnimator.animateTo(1)
  }

  setSpeed(_speed: number): void {
  }

  setColorSensitivity(_sensitivity: number): void {
  }

  setOpacity(_opacity: number): void {
  }

  getPoints(): THREE.Points | null {
    return this.points
  }

  getParticleCount(): number {
    return this.currentCount
  }

  getCurrentPreset(): VisualizerPreset {
    return this.currentPreset
  }

  getCurrentVisualizationMode(): VisualizationMode {
    return this.currentVisualizationMode
  }

  getTempVector(): THREE.Vector3 {
    return this.tempVector
  }

  destroy(): void {
    if (this.geometry) {
      this.geometry.dispose()
    }
    if (this.material) {
      this.material.dispose()
    }
    this.particles = []
    this.positionAnimators.clear()
  }
}
