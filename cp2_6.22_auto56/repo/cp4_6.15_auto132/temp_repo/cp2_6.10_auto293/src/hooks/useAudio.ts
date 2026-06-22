import { useRef, useCallback } from 'react'

export const useAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null)

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }
  }, [])

  const playSynthSound = useCallback(() => {
    initAudioContext()
    const ctx = audioContextRef.current
    if (!ctx) return

    const now = ctx.currentTime
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    const filterNode = ctx.createBiquadFilter()

    const waveforms: OscillatorType[] = ['sine', 'square', 'sawtooth', 'triangle']
    const waveform = waveforms[Math.floor(Math.random() * waveforms.length)]
    const baseFreq = 220 + Math.random() * 440

    oscillator.type = waveform
    oscillator.frequency.setValueAtTime(baseFreq, now)
    oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.1)
    oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.75, now + 0.3)

    filterNode.type = 'lowpass'
    filterNode.frequency.setValueAtTime(2000, now)
    filterNode.frequency.exponentialRampToValueAtTime(500, now + 0.4)

    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

    oscillator.connect(filterNode)
    filterNode.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start(now)
    oscillator.stop(now + 0.5)

    oscillator.onended = () => {
      oscillator.disconnect()
      filterNode.disconnect()
      gainNode.disconnect()
    }
  }, [initAudioContext])

  const playConnectSound = useCallback(() => {
    initAudioContext()
    const ctx = audioContextRef.current
    if (!ctx) return

    const now = ctx.currentTime
    const oscillator1 = ctx.createOscillator()
    const oscillator2 = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator1.type = 'sine'
    oscillator1.frequency.setValueAtTime(440, now)
    oscillator1.frequency.exponentialRampToValueAtTime(880, now + 0.2)

    oscillator2.type = 'sine'
    oscillator2.frequency.setValueAtTime(550, now)
    oscillator2.frequency.exponentialRampToValueAtTime(1100, now + 0.2)

    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

    oscillator1.connect(gainNode)
    oscillator2.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator1.start(now)
    oscillator2.start(now)
    oscillator1.stop(now + 0.3)
    oscillator2.stop(now + 0.3)

    const cleanup = () => {
      oscillator1.disconnect()
      oscillator2.disconnect()
      gainNode.disconnect()
    }
    oscillator1.onended = cleanup
  }, [initAudioContext])

  const playPulseSound = useCallback(() => {
    initAudioContext()
    const ctx = audioContextRef.current
    if (!ctx) return

    const now = ctx.currentTime
    const oscillators: OscillatorNode[] = []
    const gainNode = ctx.createGain()

    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(150 + i * 50 + Math.random() * 100, now)
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.4)
      osc.connect(gainNode)
      osc.start(now + i * 0.05)
      osc.stop(now + 0.5)
      oscillators.push(osc)
    }

    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.03)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

    gainNode.connect(ctx.destination)

    oscillators[0].onended = () => {
      oscillators.forEach(osc => osc.disconnect())
      gainNode.disconnect()
    }
  }, [initAudioContext])

  return {
    initAudioContext,
    playSynthSound,
    playConnectSound,
    playPulseSound
  }
}
