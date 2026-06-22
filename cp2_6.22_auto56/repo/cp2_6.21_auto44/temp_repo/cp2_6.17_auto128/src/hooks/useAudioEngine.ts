import { useRef, useCallback, useEffect } from 'react'

interface ActiveOscillator {
  osc: OscillatorNode
  gain: GainNode
}

export function useAudioEngine() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const reverbRef = useRef<ConvolverNode | null>(null)
  const activeOscillatorsRef = useRef<Map<number, ActiveOscillator>>(new Map())

  const createReverbImpulse = useCallback((context: AudioContext, duration: number, decay: number): AudioBuffer => {
    const sampleRate = context.sampleRate
    const length = sampleRate * duration
    const impulse = context.createBuffer(2, length, sampleRate)
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
      }
    }
    
    return impulse
  }, [])

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const ctx = audioContextRef.current

      masterGainRef.current = ctx.createGain()
      masterGainRef.current.gain.value = 0.3

      reverbRef.current = ctx.createConvolver()
      reverbRef.current.buffer = createReverbImpulse(ctx, 1.5, 2.0)

      const dryGain = ctx.createGain()
      dryGain.gain.value = 0.6
      const wetGain = ctx.createGain()
      wetGain.gain.value = 0.4

      masterGainRef.current.connect(dryGain)
      masterGainRef.current.connect(reverbRef.current)
      reverbRef.current.connect(wetGain)
      dryGain.connect(ctx.destination)
      wetGain.connect(ctx.destination)
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }
  }, [createReverbImpulse])

  const playNote = useCallback((freq: number, duration: number = 0.5) => {
    initAudioContext()
    
    const ctx = audioContextRef.current
    const masterGain = masterGainRef.current
    
    if (!ctx || !masterGain) return

    if (activeOscillatorsRef.current.has(freq)) {
      return
    }

    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.value = freq

    const now = ctx.currentTime
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration)

    osc.connect(gainNode)
    gainNode.connect(masterGain)

    osc.start(now)
    osc.stop(now + duration)

    activeOscillatorsRef.current.set(freq, { osc, gain: gainNode })

    osc.onended = () => {
      activeOscillatorsRef.current.delete(freq)
      osc.disconnect()
      gainNode.disconnect()
    }
  }, [initAudioContext])

  const stopNote = useCallback((freq: number) => {
    const ctx = audioContextRef.current
    const active = activeOscillatorsRef.current.get(freq)
    
    if (ctx && active) {
      const now = ctx.currentTime
      active.gain.gain.cancelScheduledValues(now)
      active.gain.gain.setValueAtTime(active.gain.gain.value, now)
      active.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
      
      setTimeout(() => {
        active.osc.stop()
        activeOscillatorsRef.current.delete(freq)
      }, 100)
    }
  }, [])

  useEffect(() => {
    return () => {
      activeOscillatorsRef.current.forEach(({ osc, gain }) => {
        osc.stop()
        osc.disconnect()
        gain.disconnect()
      })
      activeOscillatorsRef.current.clear()
      
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return { playNote, stopNote, initAudioContext }
}
