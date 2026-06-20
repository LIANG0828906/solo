let audioContext: AudioContext | null = null

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

export const playForgeSuccess = (): void => {
  const ctx = getAudioContext()
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(523, ctx.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(784, ctx.currentTime + 0.1)
  oscillator.frequency.exponentialRampToValueAtTime(1047, ctx.currentTime + 0.2)

  gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + 0.4)
}

export const playForgeFail = (): void => {
  const ctx = getAudioContext()
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.type = 'sawtooth'
  oscillator.frequency.setValueAtTime(200, ctx.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3)

  gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + 0.3)
}

export const playAttackHit = (): void => {
  const ctx = getAudioContext()
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.type = 'square'
  oscillator.frequency.setValueAtTime(150, ctx.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1)

  gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + 0.1)
}

export const playSpecialEffect = (): void => {
  const ctx = getAudioContext()
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(440, ctx.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05)
  oscillator.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.1)

  gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + 0.2)
}

export const playVictory = (): void => {
  const ctx = getAudioContext()
  const notes = [523, 659, 784, 1047]

  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.2, ctx.currentTime + index * 0.1)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.1 + 0.3)
    osc.start(ctx.currentTime + index * 0.1)
    osc.stop(ctx.currentTime + index * 0.1 + 0.3)
  })
}
