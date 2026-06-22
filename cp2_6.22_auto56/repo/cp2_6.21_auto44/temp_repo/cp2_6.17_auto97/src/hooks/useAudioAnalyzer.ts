import { useEffect, useRef, useState, useCallback } from 'react'
import { useGameStore } from '../stores/gameStore'

export function useAudioAnalyzer() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const startTimeRef = useRef<number>(0)
  const pauseOffsetRef = useRef<number>(0)
  const rafRef = useRef<number>(0)
  const lastUpdateRef = useRef<number>(0)

  const [frequencyData, setFrequencyData] = useState<Float32Array>(new Float32Array(128))
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const status = useGameStore(s => s.status)
  const setDominantFreq = useGameStore(s => s.setDominantFreq)
  const updateGameTime = useGameStore(s => s.updateGameTime)

  const generateMusicBuffer = useCallback((ctx: AudioContext): AudioBuffer => {
    const sampleRate = ctx.sampleRate
    const duration = 64
    const length = sampleRate * duration
    const buffer = ctx.createBuffer(2, length, sampleRate)

    const BPM = 120
    const beatDur = 60 / BPM
    const kickFreq = 60
    const bassFreq = 110
    const melodyNotes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63]

    for (let ch = 0; ch < 2; ch++) {
      const channel = buffer.getChannelData(ch)
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate
        const beatPhase = (t / beatDur) % 1
        const beatIdx = Math.floor(t / beatDur)

        let sample = 0

        if (beatPhase < 0.15) {
          const env = Math.pow(1 - beatPhase / 0.15, 2)
          sample += Math.sin(2 * Math.PI * kickFreq * t) * 0.4 * env
        }

        if (beatPhase > 0.3 && beatPhase < 0.6) {
          const env = Math.sin(Math.PI * (beatPhase - 0.3) / 0.3)
          const bassNote = bassFreq * (beatIdx % 4 === 0 ? 1 : 1.5)
          sample += Math.sin(2 * Math.PI * bassNote * t) * 0.2 * env
        }

        if (beatIdx % 2 === 0) {
          const noteIdx = Math.floor(beatIdx / 2) % melodyNotes.length
          const noteFreq = melodyNotes[noteIdx]
          const env = Math.exp(-3 * beatPhase)
          sample += Math.sin(2 * Math.PI * noteFreq * t) * 0.12 * env
          sample += Math.sin(2 * Math.PI * noteFreq * 2 * t) * 0.06 * env
        }

        const hihatEnv = beatPhase < 0.05 || (beatPhase > 0.45 && beatPhase < 0.55)
          ? 0.1 : 0
        const noise = (Math.random() * 2 - 1) * hihatEnv
        sample += noise * 0.05

        sample = Math.max(-1, Math.min(1, sample))
        channel[i] = sample * 0.85
      }
    }

    return buffer
  }, [])

  const startAudio = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        audioContextRef.current = new Ctx()
      }

      const ctx = audioContextRef.current

      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      if (!analyserRef.current) {
        analyserRef.current = ctx.createAnalyser()
        analyserRef.current.fftSize = 256
        analyserRef.current.smoothingTimeConstant = 0.7
      }

      if (!gainNodeRef.current) {
        gainNodeRef.current = ctx.createGain()
        gainNodeRef.current.gain.value = 0.8
      }

      if (!sourceRef.current) {
        const buf = generateMusicBuffer(ctx)
        sourceRef.current = ctx.createBufferSource()
        sourceRef.current.buffer = buf
        sourceRef.current.connect(gainNodeRef.current)
        gainNodeRef.current.connect(analyserRef.current)
        analyserRef.current.connect(ctx.destination)
      }

      const offset = pauseOffsetRef.current
      sourceRef.current.start(0, offset)
      startTimeRef.current = ctx.currentTime - offset
      setIsPlaying(true)
      setIsLoaded(true)

      const freqData = new Float32Array(analyserRef.current.frequencyBinCount)
      lastUpdateRef.current = performance.now()

      const animate = () => {
        if (!analyserRef.current || !audioContextRef.current) return
        const now = performance.now()
        if (now - lastUpdateRef.current >= 16) {
          analyserRef.current.getFloatFrequencyData(freqData)
          setFrequencyData(new Float32Array(freqData))

          let sum = 0
          let maxIdx = 0
          let maxVal = -Infinity
          for (let i = 0; i < freqData.length; i++) {
            const v = (freqData[i] + 100) / 100
            sum += v * i
            if (freqData[i] > maxVal) {
              maxVal = freqData[i]
              maxIdx = i
            }
          }
          const dominant = (maxIdx / freqData.length)
          setDominantFreq(dominant)

          const audioTime = audioContextRef.current.currentTime - startTimeRef.current
          updateGameTime(audioTime * 1000, 1 / 60)
          lastUpdateRef.current = now
        }
        rafRef.current = requestAnimationFrame(animate)
      }
      animate()

    } catch (e) {
      console.error('Audio start failed:', e)
    }
  }, [generateMusicBuffer, setDominantFreq, updateGameTime])

  const stopAudio = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.stop()
      } catch {}
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
    setIsPlaying(false)
  }, [])

  const pauseAudio = useCallback(() => {
    if (audioContextRef.current && isPlaying) {
      pauseOffsetRef.current = audioContextRef.current.currentTime - startTimeRef.current
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      if (sourceRef.current) {
        try {
          sourceRef.current.stop()
        } catch {}
        sourceRef.current.disconnect()
        sourceRef.current = null
      }
      setIsPlaying(false)
    }
  }, [isPlaying])

  const resetAudio = useCallback(() => {
    stopAudio()
    pauseOffsetRef.current = 0
    setFrequencyData(new Float32Array(128))
    setDominantFreq(0)
  }, [stopAudio, setDominantFreq])

  useEffect(() => {
    if (status === 'playing' && !isPlaying) {
      startAudio()
    } else if (status === 'paused' && isPlaying) {
      pauseAudio()
    } else if ((status === 'idle' || status === 'gameover') && (isPlaying || isLoaded)) {
      resetAudio()
    }
  }, [status, isPlaying, isLoaded, startAudio, pauseAudio, resetAudio])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (sourceRef.current) {
        try { sourceRef.current.stop() } catch {}
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return {
    frequencyData,
    isPlaying,
    isLoaded,
  }
}
