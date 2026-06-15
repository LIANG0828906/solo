let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch (e) {
      return null
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

export function playDing(freq: number = 880, duration: number = 0.12, volume: number = 0.15): void {
  const ctx = getCtx()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch (e) {
    /* ignore */
  }
}

export function playFeedSound(): void {
  playDing(660, 0.1, 0.18)
  setTimeout(() => playDing(880, 0.12, 0.15), 80)
}

export function playPlaySound(): void {
  playDing(523, 0.08, 0.16)
  setTimeout(() => playDing(659, 0.08, 0.14), 60)
  setTimeout(() => playDing(784, 0.12, 0.12), 120)
}

export function playSleepSound(): void {
  playDing(440, 0.2, 0.1)
  setTimeout(() => playDing(330, 0.25, 0.08), 100)
}

export function playClickSound(): void {
  playDing(1200, 0.05, 0.1)
}

export function playAdoptSound(): void {
  playDing(523, 0.1, 0.2)
  setTimeout(() => playDing(659, 0.1, 0.18), 80)
  setTimeout(() => playDing(784, 0.1, 0.16), 160)
  setTimeout(() => playDing(1047, 0.2, 0.14), 240)
}
