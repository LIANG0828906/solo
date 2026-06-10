import * as THREE from 'three'

interface PulseRing {
  mesh: THREE.Mesh
  material: THREE.MeshBasicMaterial
  startTime: number
  duration: number
  maxScale: number
}

interface GlobalConfig {
  colors: {
    iceBlue: string
    pinkCrystal: string
    background: string
  }
}

const NOTE_FREQUENCIES = [
  261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88,
  523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77
]

export class PulseEffect {
  private scene: THREE.Scene
  private _config: GlobalConfig
  private pulses: PulseRing[] = []
  private audioContext: AudioContext | null = null
  private geometryCache: THREE.RingGeometry | null = null

  constructor(scene: THREE.Scene, config: GlobalConfig) {
    this.scene = scene
    this._config = config
    this.initGeometry()
  }

  private initGeometry() {
    this.geometryCache = new THREE.RingGeometry(0.8, 1, 64)
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return this.audioContext
  }

  trigger(position: THREE.Vector3, color: string) {
    const defaultColors = [this._config.colors.iceBlue, this._config.colors.pinkCrystal, color]
    const pulseColor = defaultColors[Math.floor(Math.random() * defaultColors.length)]
    this.createPulseRing(position, pulseColor, 1.0)
    this.createPulseRing(position, pulseColor, 1.5, 0.1)
    this.createPulseRing(position, pulseColor, 2.0, 0.2)
    this.playChimeSound()
  }

  private createPulseRing(
    position: THREE.Vector3,
    color: string,
    maxScale: number,
    delay: number = 0
  ) {
    setTimeout(() => {
      if (!this.geometryCache) return

      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      })

      const mesh = new THREE.Mesh(this.geometryCache, material)
      mesh.position.copy(position)
      mesh.position.y += 0.01
      mesh.rotation.x = -Math.PI / 2
      mesh.scale.set(0.1, 0.1, 0.1)

      this.scene.add(mesh)

      this.pulses.push({
        mesh,
        material,
        startTime: performance.now(),
        duration: 1200,
        maxScale
      })
    }, delay * 1000)
  }

  private playChimeSound() {
    try {
      const ctx = this.getAudioContext()
      
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const baseFreq = NOTE_FREQUENCIES[Math.floor(Math.random() * NOTE_FREQUENCIES.length)]
      const harmonics = [1, 2, 3]
      const gains: GainNode[] = []

      harmonics.forEach((harmonic, index) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const filter = ctx.createBiquadFilter()

        osc.type = 'sine'
        osc.frequency.value = baseFreq * harmonic

        filter.type = 'lowpass'
        filter.frequency.value = 2000 + index * 500
        filter.Q.value = 1

        const volume = 0.15 / (harmonic * 1.5)
        gain.gain.setValueAtTime(0, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5 + index * 0.3)

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)

        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 2)

        gains.push(gain)
      })

      setTimeout(() => {
        gains.forEach(gain => {
          try { gain.disconnect() } catch (e) {}
        })
      }, 2500)

    } catch (e) {
      console.warn('Audio playback failed:', e)
    }
  }

  update(_delta: number) {
    const now = performance.now()
    const toRemove: number[] = []

    this.pulses.forEach((pulse, index) => {
      const elapsed = now - pulse.startTime
      const progress = Math.min(elapsed / pulse.duration, 1)

      const easeOut = 1 - Math.pow(1 - progress, 3)
      const scale = 0.1 + easeOut * (pulse.maxScale - 0.1)
      pulse.mesh.scale.set(scale, scale, scale)

      pulse.material.opacity = 0.8 * (1 - progress)

      if (progress >= 1) {
        toRemove.push(index)
      }
    })

    for (let i = toRemove.length - 1; i >= 0; i--) {
      const index = toRemove[i]
      const pulse = this.pulses[index]
      this.scene.remove(pulse.mesh)
      pulse.material.dispose()
      this.pulses.splice(index, 1)
    }
  }

  dispose() {
    this.pulses.forEach(pulse => {
      this.scene.remove(pulse.mesh)
      pulse.material.dispose()
    })
    this.pulses = []

    if (this.geometryCache) {
      this.geometryCache.dispose()
      this.geometryCache = null
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}
