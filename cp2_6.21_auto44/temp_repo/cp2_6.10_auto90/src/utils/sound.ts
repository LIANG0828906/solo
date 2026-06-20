let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

export function playWoodSnap(): void {
  try {
    const ctx = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = 'square'
    oscillator.frequency.setValueAtTime(180, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08)

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.1)
  } catch (e) {
    console.warn('Audio playback failed:', e)
  }
}

export function playWoodClick(): void {
  try {
    const ctx = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(600, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.05)

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.08)
  } catch (e) {
    console.warn('Audio playback failed:', e)
  }
}

export function playSuccessChime(): void {
  try {
    const ctx = getAudioContext()
    const frequencies = [523.25, 659.25, 783.99]

    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1)

      gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.1)
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.1 + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.8)

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.start(ctx.currentTime + i * 0.1)
      oscillator.stop(ctx.currentTime + i * 0.1 + 0.8)
    })
  } catch (e) {
    console.warn('Audio playback failed:', e)
  }
}
