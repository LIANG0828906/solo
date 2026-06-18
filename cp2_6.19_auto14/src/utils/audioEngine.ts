import { SynthModule, Connection } from '@/store/moduleStore'

type OscType = OscillatorType
const OSC_TYPES: OscType[] = ['sine', 'square', 'sawtooth', 'triangle']

export interface SynthNodeChain {
  input: AudioNode
  output: AudioNode
  internalNodes: AudioNode[]
  dispose: () => void
}

class AudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private analyserNode: AnalyserNode | null = null
  private chains: Map<string, SynthNodeChain> = new Map()
  private _initialized = false

  ensureContext(): boolean {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (e) {
        console.error('Web Audio API not supported', e)
        return false
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return true
  }

  initFromUserGesture(): boolean {
    const ok = this.ensureContext()
    if (!ok) return false
    if (!this._initialized) {
      this._initialized = true
      this.analyserNode = this.ctx!.createAnalyser()
      this.analyserNode.fftSize = 2048
      this.masterGain = this.ctx!.createGain()
      this.masterGain.gain.value = 0.25
      this.masterGain.connect(this.analyserNode)
      this.analyserNode.connect(this.ctx!.destination)
    }
    return true
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyserNode
  }

  getContext(): AudioContext | null {
    return this.ctx
  }

  private createOscillator(mod: SynthModule): SynthNodeChain {
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    osc.type = OSC_TYPES[Math.min(Math.max(0, Math.floor(mod.params.type)), 3)] || 'sine'
    osc.frequency.value = mod.params.frequency
    osc.detune.value = mod.params.detune
    osc.start()

    const gain = ctx.createGain()
    gain.gain.value = 0.4
    osc.connect(gain)

    return {
      input: gain,
      output: gain,
      internalNodes: [osc, gain],
      dispose: () => {
        try { osc.stop() } catch {}
        osc.disconnect()
        gain.disconnect()
      },
    }
  }

  private createFilter(mod: SynthModule): SynthNodeChain {
    const ctx = this.ctx!
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = mod.params.frequency
    filter.Q.value = mod.params.Q
    filter.gain.value = mod.params.gain
    return {
      input: filter,
      output: filter,
      internalNodes: [filter],
      dispose: () => { filter.disconnect() },
    }
  }

  private createEnvelope(mod: SynthModule): SynthNodeChain {
    const ctx = this.ctx!
    const env = ctx.createGain()
    const now = ctx.currentTime
    env.gain.setValueAtTime(0, now)
    env.gain.linearRampToValueAtTime(1, now + Math.max(0.001, mod.params.attack))
    env.gain.linearRampToValueAtTime(
      Math.max(0, mod.params.sustain),
      now + Math.max(0.001, mod.params.attack) + Math.max(0.001, mod.params.decay)
    )
    return {
      input: env,
      output: env,
      internalNodes: [env],
      dispose: () => { env.disconnect() },
    }
  }

  private createDelay(mod: SynthModule): SynthNodeChain {
    const ctx = this.ctx!
    const inputGain = ctx.createGain()
    inputGain.gain.value = 1

    const delay = ctx.createDelay(5.0)
    delay.delayTime.value = mod.params.delayTime

    const feedback = ctx.createGain()
    feedback.gain.value = Math.min(0.95, mod.params.feedback)

    const wet = ctx.createGain()
    wet.gain.value = mod.params.mix

    const dry = ctx.createGain()
    dry.gain.value = 1 - mod.params.mix

    const outputGain = ctx.createGain()
    outputGain.gain.value = 1

    inputGain.connect(delay)
    inputGain.connect(dry)
    dry.connect(outputGain)

    delay.connect(feedback)
    feedback.connect(delay)
    delay.connect(wet)
    wet.connect(outputGain)

    return {
      input: inputGain,
      output: outputGain,
      internalNodes: [inputGain, delay, feedback, wet, dry, outputGain],
      dispose: () => {
        inputGain.disconnect()
        delay.disconnect()
        feedback.disconnect()
        wet.disconnect()
        dry.disconnect()
        outputGain.disconnect()
      },
    }
  }

  private createNodeChain(mod: SynthModule): SynthNodeChain | null {
    if (!this.ctx) return null
    switch (mod.type) {
      case 'oscillator': return this.createOscillator(mod)
      case 'filter': return this.createFilter(mod)
      case 'envelope': return this.createEnvelope(mod)
      case 'delay': return this.createDelay(mod)
      default: return null
    }
  }

  start(modules: SynthModule[], connections: Connection[]): boolean {
    if (!this.initFromUserGesture()) return false

    this.stop()

    for (const mod of modules) {
      const chain = this.createNodeChain(mod)
      if (chain) {
        this.chains.set(mod.id, chain)
      }
    }

    for (const conn of connections) {
      const src = this.chains.get(conn.sourceModuleId)
      const tgt = this.chains.get(conn.targetModuleId)
      if (src && tgt) {
        try {
          src.output.connect(tgt.input)
        } catch {
          // skip invalid connections (oscillator output to another oscillator input etc.)
        }
      }
    }

    const connectedAsSource = new Set<string>()
    for (const c of connections) connectedAsSource.add(c.sourceModuleId)

    for (const mod of modules) {
      const chain = this.chains.get(mod.id)
      if (!chain) continue
      if (!connectedAsSource.has(mod.id)) {
        try {
          chain.output.connect(this.masterGain!)
        } catch {}
      }
    }

    if (modules.length > 0 && connectedAsSource.size === 0) {
      const osc = modules.find((m) => m.type === 'oscillator')
      if (osc) {
        const chain = this.chains.get(osc.id)
        if (chain) {
          try { chain.output.connect(this.masterGain!) } catch {}
        }
      }
    }

    return true
  }

  stop() {
    for (const chain of this.chains.values()) {
      try { chain.dispose() } catch {}
    }
    this.chains.clear()
  }

  destroy() {
    this.stop()
    if (this.masterGain) {
      try { this.masterGain.disconnect() } catch {}
    }
    if (this.analyserNode) {
      try { this.analyserNode.disconnect() } catch {}
    }
    if (this.ctx) {
      try { this.ctx.close() } catch {}
    }
    this.masterGain = null
    this.analyserNode = null
    this.ctx = null
    this._initialized = false
  }

  updateParam(moduleId: string, key: string, value: number) {
    if (!this.ctx) return
    const chain = this.chains.get(moduleId)
    if (!chain) return
    const nodes = chain.internalNodes

    for (const node of nodes) {
      try {
        if (node instanceof OscillatorNode) {
          if (key === 'frequency') node.frequency.value = value
          else if (key === 'detune') node.detune.value = value
          else if (key === 'type') node.type = OSC_TYPES[Math.min(Math.max(0, Math.floor(value)), 3)] || 'sine'
        } else if (node instanceof BiquadFilterNode) {
          if (key === 'frequency') node.frequency.value = value
          else if (key === 'Q') node.Q.value = value
          else if (key === 'gain') node.gain.value = value
        } else if (node instanceof DelayNode) {
          if (key === 'delayTime') node.delayTime.value = value
        } else if (node instanceof GainNode) {
          if (key === 'feedback') node.gain.value = Math.min(0.95, value)
          else if (key === 'mix') node.gain.value = value
          else if (key === 'sustain') node.gain.value = value
        }
      } catch {}
    }
  }
}

export const audioEngine = new AudioEngine()
