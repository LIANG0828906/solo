let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch {
      return null
    }
  }
  return audioCtx
}

interface ToneOptions {
  freq: number
  endFreq?: number
  duration: number
  type?: OscillatorType
  volume?: number
  attack?: number
  release?: number
}

function playTone(opts: ToneOptions) {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  const {
    freq,
    endFreq,
    duration,
    type = 'square',
    volume = 0.08,
    attack = 0.01,
    release = 0.05
  } = opts

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(freq, now)
  if (endFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 20), now + duration)
  }

  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(volume, now + attack)
  gain.gain.setValueAtTime(volume, now + Math.max(duration - release, attack))
  gain.gain.linearRampToValueAtTime(0, now + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + duration + 0.02)
}

export const sfx = {
  click() {
    playTone({ freq: 880, duration: 0.06, type: 'square', volume: 0.05 })
  },
  hover() {
    playTone({ freq: 1320, duration: 0.03, type: 'triangle', volume: 0.03 })
  },
  place() {
    playTone({ freq: 523, endFreq: 784, duration: 0.12, type: 'triangle', volume: 0.08 })
  },
  move() {
    playTone({ freq: 220, endFreq: 330, duration: 0.1, type: 'sawtooth', volume: 0.04 })
  },
  turn() {
    playTone({ freq: 660, duration: 0.06, type: 'square', volume: 0.03 })
  },
  attack() {
    playTone({ freq: 1200, endFreq: 120, duration: 0.18, type: 'sawtooth', volume: 0.1 })
    setTimeout(
      () => playTone({ freq: 150, duration: 0.15, type: 'square', volume: 0.07 }),
      100
    )
  },
  hit() {
    playTone({ freq: 180, endFreq: 60, duration: 0.2, type: 'square', volume: 0.12 })
  },
  defend() {
    playTone({ freq: 440, duration: 0.14, type: 'sine', volume: 0.08 })
  },
  scan() {
    playTone({ freq: 800, endFreq: 1600, duration: 0.25, type: 'triangle', volume: 0.06 })
  },
  pickup() {
    playTone({ freq: 523, endFreq: 1046, duration: 0.18, type: 'sine', volume: 0.08 })
  },
  victory() {
    const notes = [523, 659, 784, 1046]
    notes.forEach((f, i) =>
      setTimeout(() => playTone({ freq: f, duration: 0.2, type: 'triangle', volume: 0.1 }), i * 120)
    )
  },
  destroy() {
    playTone({ freq: 440, endFreq: 40, duration: 0.5, type: 'sawtooth', volume: 0.15 })
    setTimeout(
      () => playTone({ freq: 80, endFreq: 20, duration: 0.4, type: 'square', volume: 0.1 }),
      100
    )
  }
}
