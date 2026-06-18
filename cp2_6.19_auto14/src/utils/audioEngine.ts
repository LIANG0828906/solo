import { ModuleType, SynthModule, Connection } from '@/store/moduleStore'

type OscType = 'sine' | 'square' | 'sawtooth' | 'triangle'

const OSC_TYPES: OscType[] = ['sine', 'square', 'sawtooth', 'triangle']

class AudioEngine {
  private ctx: AudioContext | null = null
  private nodes: Map<string, AudioNode> = new Map()
  private analyser: AnalyserNode | null = null
  private masterGain: GainNode | null = null

  init() {
    if (this.ctx) return
    this.ctx = new AudioContext()
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 2048
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.3
    this.masterGain.connect(this.analyser)
    this.analyser.connect(this.ctx.destination)
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser
  }

  start(modules: SynthModule[], connections: Connection[]) {
    this.stop()
    this.init()

    if (!this.ctx || !this.masterGain) return

    this.nodes.clear()

    for (const mod of modules) {
      const node = this.createNode(mod)
      if (node) {
        this.nodes.set(mod.id, node)
      }
    }

    for (const conn of connections) {
      const sourceNode = this.nodes.get(conn.sourceModuleId)
      const targetNode = this.nodes.get(conn.targetModuleId)

      if (sourceNode && targetNode) {
        try {
          sourceNode.connect(targetNode)
        } catch {
          // skip invalid connections
        }
      }
    }

    const oscillatorIds = modules
      .filter((m) => m.type === 'oscillator')
      .map((m) => m.id)

    const connectedOscIds = new Set(
      connections
        .filter((c) => oscillatorIds.includes(c.sourceModuleId))
        .map((c) => c.sourceModuleId)
    )

    const terminalIds = new Set<string>()
    for (const mod of modules) {
      const isSource = connections.some((c) => c.sourceModuleId === mod.id)
      const isTarget = connections.some((c) => c.targetModuleId === mod.id)
      if (!isSource && isTarget) {
        terminalIds.add(mod.id)
      }
    }

    for (const [id, node] of this.nodes.entries()) {
      if (terminalIds.has(id) || !connectedOscIds.has(id)) {
        try {
          node.connect(this.masterGain!)
        } catch {
          // skip
        }
      }
    }

    if (connectedOscIds.size === 0) {
      for (const [id, node] of this.nodes.entries()) {
        if (oscillatorIds.includes(id)) {
          try {
            node.connect(this.masterGain!)
          } catch {
            // skip
          }
        }
      }
    }
  }

  stop() {
    for (const node of this.nodes.values()) {
      try {
        if (node instanceof OscillatorNode) {
          node.stop()
        }
        node.disconnect()
      } catch {
        // already stopped
      }
    }
    this.nodes.clear()
  }

  updateParam(moduleId: string, key: string, value: number) {
    const node = this.nodes.get(moduleId)
    if (!node) return

    try {
      if (node instanceof OscillatorNode) {
        if (key === 'frequency') node.frequency.value = value
        if (key === 'detune') node.detune.value = value
        if (key === 'type') {
          node.type = OSC_TYPES[Math.min(Math.floor(value), 3)] || 'sine'
        }
      } else if (node instanceof BiquadFilterNode) {
        if (key === 'frequency') node.frequency.value = value
        if (key === 'Q') node.Q.value = value
        if (key === 'gain') node.gain.value = value
      } else if (node instanceof DelayNode) {
        if (key === 'delayTime') node.delayTime.value = value
      } else if (node instanceof GainNode) {
        if (key === 'feedback' || key === 'mix' || key === 'gain') {
          node.gain.value = value
        }
      }
    } catch {
      // param update failed
    }
  }

  private createNode(mod: SynthModule): AudioNode | null {
    if (!this.ctx) return null

    switch (mod.type) {
      case 'oscillator': {
        const osc = this.ctx.createOscillator()
        osc.type = OSC_TYPES[Math.min(Math.floor(mod.params.type), 3)] || 'sine'
        osc.frequency.value = mod.params.frequency
        osc.detune.value = mod.params.detune
        osc.start()
        return osc
      }
      case 'filter': {
        const filter = this.ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = mod.params.frequency
        filter.Q.value = mod.params.Q
        filter.gain.value = mod.params.gain
        return filter
      }
      case 'envelope': {
        const gain = this.ctx.createGain()
        gain.gain.value = mod.params.sustain
        gain.gain.setValueAtTime(0, this.ctx.currentTime)
        gain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + mod.params.attack)
        gain.gain.linearRampToValueAtTime(
          mod.params.sustain,
          this.ctx.currentTime + mod.params.attack + mod.params.decay
        )
        return gain
      }
      case 'delay': {
        const delay = this.ctx.createDelay(5)
        delay.delayTime.value = mod.params.delayTime

        const feedback = this.ctx.createGain()
        feedback.gain.value = mod.params.feedback

        const mix = this.ctx.createGain()
        mix.gain.value = mod.params.mix

        delay.connect(feedback)
        feedback.connect(delay)

        const merger = this.ctx.createGain()
        merger.gain.value = 1

        delay.connect(mix)
        mix.connect(merger)

        return this.createDelayChain(delay, feedback, mix, merger)
      }
      default:
        return null
    }
  }

  private createDelayChain(
    delay: DelayNode,
    feedback: GainNode,
    _mix: GainNode,
    merger: GainNode
  ): AudioNode {
    const wrapper: any = {
      _delay: delay,
      _feedback: feedback,
      _merger: merger,
      connect(dest: AudioNode) {
        merger.connect(dest)
        return dest
      },
      disconnect() {
        try {
          delay.disconnect()
          feedback.disconnect()
          _mix.disconnect()
          merger.disconnect()
        } catch {}
      },
    }

    const inputProxy = this.ctx!.createGain()
    inputProxy.gain.value = 1
    inputProxy.connect(delay)
    inputProxy.connect(merger)

    wrapper._input = inputProxy
    wrapper.connect = (dest: AudioNode) => {
      merger.connect(dest)
      return dest
    }
    wrapper.disconnect = () => {
      try {
        inputProxy.disconnect()
        delay.disconnect()
        feedback.disconnect()
        _mix.disconnect()
        merger.disconnect()
      } catch {}
    }

    return wrapper as unknown as AudioNode
  }
}

export const audioEngine = new AudioEngine()
