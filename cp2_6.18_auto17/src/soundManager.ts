import { eventBus } from './eventBus'
import { Tower, Zombie, TowerType, ZombieType } from './types'

type SoundId = string

interface ActiveSound {
  id: SoundId
  source: AudioBufferSourceNode | OscillatorNode
  gainNode: GainNode
  startTime: number
}

export class SoundManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private volume = 0.3
  private maxConcurrent = 5
  private activeSounds: ActiveSound[] = []
  private idCounter = 0

  private lastTowerAttackTime: Record<string, number> = {}
  private towerAttackThrottle = 80

  private lastZombieHitTime = 0
  private zombieHitThrottle = 60

  private lastGoldTime = 0
  private goldThrottle = 100

  private lastLivesTime = 0
  private livesThrottle = 200

  init(): void {
    this.ctx = new AudioContext()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = this.volume
    this.masterGain.connect(this.ctx.destination)

    this.registerEvents()
  }

  private ensureContext(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  private registerEvents(): void {
    eventBus.on('tower:attack', (data) => {
      const { tower } = data as { tower: Tower; target: Zombie }
      const now = performance.now()
      const lastTime = this.lastTowerAttackTime[tower.id] || 0
      if (now - lastTime < this.towerAttackThrottle) return
      this.lastTowerAttackTime[tower.id] = now
      this.playTowerAttack(tower.type)
    })

    eventBus.on('zombie:hit', (data) => {
      const zombie = data as Zombie
      const now = performance.now()
      if (now - this.lastZombieHitTime < this.zombieHitThrottle) return
      this.lastZombieHitTime = now
      this.playZombieHit(zombie.type)
    })

    eventBus.on('zombie:death', (data) => {
      const zombie = data as Zombie
      this.playZombieDeath(zombie.type)
    })

    eventBus.on('zombie:spawn', (data) => {
      const zombie = data as Zombie
      if (zombie.type === 'elite') {
        this.playEliteSpawn()
      }
    })

    eventBus.on('tower:place', () => {
      this.playPlaceTower()
    })

    eventBus.on('tower:upgrade', () => {
      this.playUpgradeTower()
    })

    eventBus.on('ui:goldUpdate', () => {
      const now = performance.now()
      if (now - this.lastGoldTime < this.goldThrottle) return
      this.lastGoldTime = now
      this.playGoldGain()
    })

    eventBus.on('ui:livesUpdate', () => {
      const now = performance.now()
      if (now - this.lastLivesTime < this.livesThrottle) return
      this.lastLivesTime = now
      this.playLifeLost()
    })
  }

  private play(soundFn: (ctx: AudioContext, masterGain: GainNode) => { source: AudioBufferSourceNode | OscillatorNode; gainNode: GainNode }): void {
    if (!this.ctx || !this.masterGain) return
    this.ensureContext()
    this.pruneFinished()

    if (this.activeSounds.length >= this.maxConcurrent) {
      const oldest = this.activeSounds.shift()
      if (oldest) {
        try { oldest.source.stop() } catch (_) { /* already stopped */ }
      }
    }

    const { source, gainNode } = soundFn(this.ctx, this.masterGain)
    const id = `snd_${++this.idCounter}`
    const now = performance.now()

    this.activeSounds.push({ id, source, gainNode, startTime: now })

    const onEnded = (): void => {
      const idx = this.activeSounds.findIndex(s => s.id === id)
      if (idx !== -1) this.activeSounds.splice(idx, 1)
    }

    if (source instanceof AudioBufferSourceNode) {
      source.onended = onEnded
    } else {
      source.onended = onEnded
    }
  }

  private pruneFinished(): void {
    const now = performance.now()
    this.activeSounds = this.activeSounds.filter(s => {
      if (now - s.startTime > 3000) {
        try { s.source.stop() } catch (_) { /* already stopped */ }
        return false
      }
      return true
    })
  }

  private playTowerAttack(type: TowerType): void {
    switch (type) {
      case 'machinegun':
        this.playMachinegunShot()
        break
      case 'flame':
        this.playFlameShot()
        break
      case 'slow':
        this.playSlowShot()
        break
    }
  }

  private playMachinegunShot(): void {
    this.play((ctx, master) => {
      const bufferSize = ctx.sampleRate * 0.06
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate
        const envelope = Math.exp(-t * 80)
        const noise = (Math.random() * 2 - 1)
        const tone = Math.sin(2 * Math.PI * 800 * t) * 0.4
        data[i] = (noise * 0.6 + tone) * envelope
      }

      const source = ctx.createBufferSource()
      source.buffer = buffer

      const gainNode = ctx.createGain()
      gainNode.gain.value = 0.5

      const filter = ctx.createBiquadFilter()
      filter.type = 'highpass'
      filter.frequency.value = 600

      source.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(master)
      source.start()

      return { source, gainNode }
    })
  }

  private playFlameShot(): void {
    this.play((ctx, master) => {
      const bufferSize = ctx.sampleRate * 0.2
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate
        const envelope = t < 0.02 ? t / 0.02 : Math.exp(-(t - 0.02) * 6)
        const noise = (Math.random() * 2 - 1)
        const roar = Math.sin(2 * Math.PI * 120 * t) * 0.3
        const crackle = Math.sin(2 * Math.PI * 300 * t + Math.random() * 2) * 0.2
        data[i] = (noise * 0.4 + roar + crackle) * envelope
      }

      const source = ctx.createBufferSource()
      source.buffer = buffer

      const gainNode = ctx.createGain()
      gainNode.gain.value = 0.45

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 800
      filter.Q.value = 1.5

      source.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(master)
      source.start()

      return { source, gainNode }
    })
  }

  private playSlowShot(): void {
    this.play((ctx, master) => {
      const duration = 0.15
      const bufferSize = ctx.sampleRate * duration
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate
        const envelope = Math.sin(Math.PI * t / duration)
        const sweepFreq = 2000 - t * 12000
        const sweep = Math.sin(2 * Math.PI * sweepFreq * t)
        const noise = (Math.random() * 2 - 1) * 0.15
        data[i] = (sweep * 0.7 + noise) * envelope
      }

      const source = ctx.createBufferSource()
      source.buffer = buffer

      const gainNode = ctx.createGain()
      gainNode.gain.value = 0.4

      const filter = ctx.createBiquadFilter()
      filter.type = 'highpass'
      filter.frequency.value = 1500

      source.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(master)
      source.start()

      return { source, gainNode }
    })
  }

  private playZombieHit(_type: ZombieType): void {
    this.play((ctx, master) => {
      const bufferSize = ctx.sampleRate * 0.08
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate
        const envelope = Math.exp(-t * 50)
        const thud = Math.sin(2 * Math.PI * 100 * t) * 0.5
        const impact = Math.sin(2 * Math.PI * 250 * t) * 0.3
        const noise = (Math.random() * 2 - 1) * 0.2
        data[i] = (thud + impact + noise) * envelope
      }

      const source = ctx.createBufferSource()
      source.buffer = buffer

      const gainNode = ctx.createGain()
      gainNode.gain.value = 0.5

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 500

      source.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(master)
      source.start()

      return { source, gainNode }
    })
  }

  private playZombieDeath(_type: ZombieType): void {
    this.play((ctx, master) => {
      const bufferSize = ctx.sampleRate * 0.3
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate
        const envelope = Math.exp(-t * 6)
        const bodyDrop = Math.sin(2 * Math.PI * 60 * t) * Math.exp(-t * 4)
        const ground = Math.sin(2 * Math.PI * 40 * t) * 0.3 * Math.max(0, 1 - t * 5)
        const dust = (Math.random() * 2 - 1) * 0.15 * Math.exp(-t * 8)
        data[i] = (bodyDrop + ground + dust) * envelope
      }

      const source = ctx.createBufferSource()
      source.buffer = buffer

      const gainNode = ctx.createGain()
      gainNode.gain.value = 0.55

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 300

      source.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(master)
      source.start()

      return { source, gainNode }
    })
  }

  private playEliteSpawn(): void {
    this.play((ctx, master) => {
      const bufferSize = ctx.sampleRate * 0.8
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate
        const envelope = t < 0.1 ? t / 0.1 : Math.exp(-(t - 0.1) * 2)
        const growl = Math.sin(2 * Math.PI * 70 * t) * 0.6
        const harmonic = Math.sin(2 * Math.PI * 140 * t) * 0.3
        const rattle = Math.sin(2 * Math.PI * 55 * t + Math.sin(2 * Math.PI * 3 * t) * 5) * 0.4
        const noise = (Math.random() * 2 - 1) * 0.08
        data[i] = (growl + harmonic + rattle + noise) * envelope
      }

      const source = ctx.createBufferSource()
      source.buffer = buffer

      const gainNode = ctx.createGain()
      gainNode.gain.value = 0.7

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 400
      filter.Q.value = 3

      source.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(master)
      source.start()

      return { source, gainNode }
    })
  }

  private playPlaceTower(): void {
    this.play((ctx, master) => {
      const bufferSize = ctx.sampleRate * 0.15
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate
        const envelope = Math.exp(-t * 20)
        const click = Math.sin(2 * Math.PI * 1200 * t) * 0.4
        const confirm = Math.sin(2 * Math.PI * 800 * t) * 0.5
        const sparkle = Math.sin(2 * Math.PI * 2000 * t) * 0.15 * Math.exp(-t * 30)
        data[i] = (click + confirm + sparkle) * envelope
      }

      const source = ctx.createBufferSource()
      source.buffer = buffer

      const gainNode = ctx.createGain()
      gainNode.gain.value = 0.45

      source.connect(gainNode)
      gainNode.connect(master)
      source.start()

      return { source, gainNode }
    })
  }

  private playUpgradeTower(): void {
    this.play((ctx, master) => {
      const bufferSize = ctx.sampleRate * 0.4
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate
        const sweepFreq = 400 + t * 1600
        const envelope = Math.exp(-t * 4)
        const sweep = Math.sin(2 * Math.PI * sweepFreq * t) * 0.4
        const shimmer = Math.sin(2 * Math.PI * 1600 * t) * 0.2 * Math.exp(-t * 6)
        const bass = Math.sin(2 * Math.PI * 200 * t) * 0.3 * Math.exp(-t * 5)
        data[i] = (sweep + shimmer + bass) * envelope
      }

      const source = ctx.createBufferSource()
      source.buffer = buffer

      const gainNode = ctx.createGain()
      gainNode.gain.value = 0.5

      source.connect(gainNode)
      gainNode.connect(master)
      source.start()

      return { source, gainNode }
    })
  }

  private playGoldGain(): void {
    this.play((ctx, master) => {
      const bufferSize = ctx.sampleRate * 0.2
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate
        const envelope = Math.exp(-t * 12)
        const coin1 = Math.sin(2 * Math.PI * 2500 * t) * 0.3 * Math.exp(-t * 15)
        const coin2 = Math.sin(2 * Math.PI * 3500 * t) * 0.2 * Math.exp(-t * 20)
        const metallic = Math.sin(2 * Math.PI * 5000 * t) * 0.1 * Math.exp(-t * 25)
        data[i] = (coin1 + coin2 + metallic) * envelope
      }

      const source = ctx.createBufferSource()
      source.buffer = buffer

      const gainNode = ctx.createGain()
      gainNode.gain.value = 0.35

      source.connect(gainNode)
      gainNode.connect(master)
      source.start()

      return { source, gainNode }
    })
  }

  private playLifeLost(): void {
    this.play((ctx, master) => {
      const bufferSize = ctx.sampleRate * 0.5
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate
        const envelope = Math.exp(-t * 3)
        const alarm = Math.sin(2 * Math.PI * 440 * t) * 0.3 * (1 - t * 1.5)
        const pulse = Math.sin(2 * Math.PI * 8 * t) * 0.5
        const low = Math.sin(2 * Math.PI * 150 * t) * 0.4 * Math.exp(-t * 2)
        data[i] = (alarm * Math.abs(pulse) + low) * envelope
      }

      const source = ctx.createBufferSource()
      source.buffer = buffer

      const gainNode = ctx.createGain()
      gainNode.gain.value = 0.6

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 800

      source.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(master)
      source.start()

      return { source, gainNode }
    })
  }

  dispose(): void {
    this.activeSounds.forEach(s => {
      try { s.source.stop() } catch (_) { /* already stopped */ }
    })
    this.activeSounds = []
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
  }
}
